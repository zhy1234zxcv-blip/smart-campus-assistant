"""教务PDF课表解析器 v3——pdfplumber表格+增强字段提取"""
import pdfplumber, json, sys, re
sys.stdout.reconfigure(encoding='utf-8')

def parse_cell(cell_text, day, section):
    """解析单个表格单元格，返回课程列表"""
    if not cell_text or len(cell_text.strip()) < 3:
        return []

    # 清理标记符
    text = cell_text.strip()
    text = re.sub(r'^[△★▲☆●◆▶▷■□]\s*', '', text)

    # 分割行
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    if not lines:
        return []

    # 第一行是课程名（可能含多个课程，用空格/特殊符分隔）
    name_line = lines[0]
    # 去掉行号前缀 (如 "3 高等数学AⅡ" → "高等数学AⅡ")
    name_line = re.sub(r'^\d+\s+', '', name_line)

    # 可能有多个课程名在同一行（很少见，但处理）
    # 简单处理：取第一段
    name = name_line.strip()
    if len(name) < 2:
        return []

    # 合并文本：换行→/，修复 "教师/:XXX" 换行断裂
    raw = text.replace('\n', '/')
    raw = re.sub(r'/{2,}', '/', raw)
    # 修复换行断裂："教师/:XXX" → "教师:XXX", "教/师:XXX" → "教师:XXX"
    raw = re.sub(r'教师\s*/[：:]', '/教师:', raw)
    raw = re.sub(r'教\s*/师\s*[：:]', '/教师:', raw)
    raw = re.sub(r'场\s*/地\s*[：:]', '/场地:', raw)
    raw = re.sub(r'场\s*/地\s*/[：:]', '/场地:', raw)
    raw = re.sub(r'场\s*地\s*/[：:]', '/场地:', raw)
    raw = re.sub(r'场地\s*/[：:]', '/场地:', raw)

    # 教师——从修复后的文本中提取（处理多行断裂）
    teacher = ''
    for pattern in [
        r'教师\s*/[：:]\s*([\S/]+?)/教学班',
        r'教师\s*/[：:]\s*([\S/]+?)(?:/考核|/选课|/课程|/行课|$)',
        r'教师[：:]\s*([\S/]+?)/教学班',
        r'教师[：:]([^\d/]{2,10}?)(?:/|教学班|考核|选课|课程|行课|$)',
    ]:
        tm = re.search(pattern, raw)
        if tm:
            t = tm.group(1).strip()
            # 验证：应该是人名（中文或拼音，不含数字和太多标点）
            # 教师名必须看起来像人名
            t = t.replace('/', '')  # 修复换行切断的教师名 (如 李/玉龙)
            if len(t) >= 2 and len(t) <= 12 and t.strip():
                teacher = t.strip()
                break

    # 场地
    location = ''
    lm = re.search(r'场地[：:]([^/]{2,25}?)(?:/|教学班|教师|考核|选课|$)', raw)
    if lm:
        location = lm.group(1).strip()
        if len(location) > 25: location = ''

    # 节次（覆盖传参）
    sm = re.search(r'\((\d+)-(\d+)节\)', raw)
    if sm:
        section = (int(sm.group(1)), int(sm.group(2)))

    # 周次——多种模式
    weeks = ''
    for pattern in [
        r'(\d+-\d+周\([单双]\)[,，\d]*(?:周)?)',  # 1-16周(双)
        r'(\d+-\d+周[,，\d\-]*(?:周)?)',          # 1-13周,15-17周
        r'(\d+-\d+周)',                            # 1-16周
    ]:
        wm = re.search(pattern, raw)
        if wm:
            weeks = wm.group(0)
            break

    if not weeks:
        # 最后尝试：匹配任何看起来像周次的内容
        wm = re.search(r'(\d+-\d+周[^(节)]*)', raw)
        if wm and len(wm.group(0)) > 5:
            weeks = wm.group(0).strip(',;')

    return [{
        "name": name,
        "teacher": teacher,
        "location": location,
        "weeks": weeks or '',
        "dayOfWeek": day,
        "startSection": section[0],
        "endSection": section[1]
    }]

def parse_pdf(filepath):
    pdf = pdfplumber.open(filepath)
    all_courses = []

    cn_day = {'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'日':7}
    sec_map = {1:(1,2), 2:(1,2), 3:(3,5), 4:(3,5), 5:(3,5), 6:(6,7), 7:(6,7), 8:(8,9), 9:(8,9), 10:(10,11), 11:(10,11), 12:(10,11)}

    day_map = {}       # col_idx → dayOfWeek
    section_col = 1     # 节次列索引
    first_page = True

    for page in pdf.pages:
        tables = page.extract_tables()
        if not tables:
            continue

        for table in tables:
            if len(table) < 3:
                continue

            # 只在第一页提取表头
            if first_page:
                for ri, row in enumerate(table):
                    for ci, cell in enumerate(row):
                        if cell:
                            for cn, day in cn_day.items():
                                if f'星期{cn}' in cell or f'周{cn}' in cell:
                                    day_map[ci] = day
                            # 找节次列
                            if ci < 3 and re.match(r'节次', cell or ''):
                                section_col = ci
                    if day_map:
                        first_page = False
                        break

            if not day_map:
                continue

            current_sec = None
            prev_row_cells = {}  # 累积上一行的单元格文本

            for row in table:
                # 节次
                sec_cell = row[section_col] if section_col < len(row) else ''
                sm = re.search(r'(\d+)', sec_cell or '')
                new_sec = None
                if sm:
                    s = int(sm.group(1))
                    new_sec = sec_map.get(s)

                # 遇到新节次 → 输出累积的课程
                if new_sec and new_sec != current_sec:
                    # 输出上一节次累积的结果
                    if current_sec:
                        for ci, day in day_map.items():
                            accumulated = prev_row_cells.get(ci, '')
                            if accumulated:
                                courses = parse_cell(accumulated, day, current_sec)
                                for c in courses:
                                    for k in ['name','teacher','location','weeks']:
                                        c[k] = re.sub(r'[\x00-\x1f\x7f-\x9f]+', '', c[k])
                                        c[k] = c[k].strip('◆◇■□●○ \t')
                                    if len(c['name']) >= 2:
                                        all_courses.append(c)
                    current_sec = new_sec
                    prev_row_cells = {}

                if not current_sec:
                    continue

                # 如果当前行有节次标记且不等于 current_sec，重置
                if new_sec and new_sec != current_sec:
                    continue

                # 累积这一行的每个星期列文本
                for ci, day in day_map.items():
                    if ci >= len(row):
                        continue
                    cell = (row[ci] or '').strip()
                    if not cell or len(cell) < 2:
                        continue
                    # 追加到累积文本
                    if ci in prev_row_cells:
                        prev_row_cells[ci] += '\n' + cell
                    else:
                        prev_row_cells[ci] = cell

            # 输出最后一个节次
            if current_sec:
                for ci, day in day_map.items():
                    accumulated = prev_row_cells.get(ci, '')
                    if accumulated:
                        courses = parse_cell(accumulated, day, current_sec)
                        for c in courses:
                            for k in ['name','teacher','location','weeks']:
                                c[k] = re.sub(r'[\x00-\x1f\x7f-\x9f]+', '', c[k])
                                c[k] = c[k].strip('◆◇■□●○ \t')
                            if len(c['name']) >= 2:
                                all_courses.append(c)

    pdf.close()

    # 去重 + 教师补全
    seen = set()
    unique = []
    tmap = {}
    for c in all_courses:
        if c['teacher']:
            tmap[c['name']] = c['teacher']
        k = f"{c['name']}-{c['dayOfWeek']}-{c['startSection']}"
        if k not in seen:
            seen.add(k)
            unique.append(c)

    for c in unique:
        if not c['teacher'] and c['name'] in tmap:
            c['teacher'] = tmap[c['name']]

    return unique

if __name__ == '__main__':
    result = parse_pdf(sys.argv[1])
    out_path = sys.argv[2] if len(sys.argv) > 2 else None
    j = json.dumps(result, ensure_ascii=False)
    if out_path:
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(j)
    else:
        print(j)
