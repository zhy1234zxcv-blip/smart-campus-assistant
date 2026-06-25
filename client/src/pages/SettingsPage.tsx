import { useState, useEffect, useRef } from 'react';
import { Key, Shield, Cpu, MessageSquare, Image } from 'lucide-react';

// 预设主流模型
const PRESET_MODELS = [
  { id: 'qwen-plus', name: '千问', desc: '日常建议·性价比' },
  { id: 'qwen-max', name: '千问 Max', desc: '最强推理·更准确' },
  { id: 'qwen-vl-max', name: '千问 VL', desc: '视觉识别·课表OCR' },
  { id: 'deepseek-v4-flash', name: 'DeepSeek V4', desc: '免费额度·速度快' },
  { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', desc: '更强推理·付费' },
];

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('qwen-plus');
  const [aiPrompt, setAiPrompt] = useState('');
  const [saved, setSaved] = useState(false);
  const [bgImage, setBgImage] = useState(localStorage.getItem('bg_image') || '');
  const [bgOpacity, setBgOpacity] = useState(parseFloat(localStorage.getItem('bg_opacity') || '0'));
  const [uiOpacity, setUiOpacity] = useState(parseFloat(localStorage.getItem('ui_opacity') || '0.18'));
  const bgRef = useRef<HTMLInputElement>(null);

  const updateBgOpacity = (val: number) => {
    setBgOpacity(val);
    localStorage.setItem('bg_opacity', String(val));
    document.documentElement.style.setProperty('--bg-opacity', String(val));
  };
  const updateUiOpacity = (val: number) => {
    setUiOpacity(val);
    localStorage.setItem('ui_opacity', String(val));
    document.documentElement.style.setProperty('--ui-opacity', String(val));
  };

  const defaultPrompt = '你是一个友好的校园助手，像学长/学姐一样给我提建议。根据今天的课程和事件，生成3-5条简短建议。';

  // 预设风格
  const presetPrompts = [
    { label: '毒舌学长', prompt: '你是一个毒舌但热心的理工科学长。用犀利的吐槽提醒我上课、写作业、别摸鱼。每条建议先损一句再给建议，语气要狠但出发点要暖。' },
    { label: '温柔学姐', prompt: '你是一个温柔细心的学姐。用关心的语气提醒我今天的安排，像照顾弟弟一样。每条建议都带着"记得哦~"的温暖感。' },
    { label: '严肃教官', prompt: '你是一个严肃的教官/辅导员。用军事化的口吻下达今天的任务，简短有力，不容反驳。格式如"08:00 高数！迟到后果自负！"' },
    { label: '段子手', prompt: '你是一个脱口秀演员转行的校园助手。每条建议都要抛一个梗或段子，让上课也变得有趣。把课程名编进笑话里。' },
    { label: '游戏化', prompt: '你是一个游戏NPC。把今天当成一个RPG副本，课程是关卡，考试是Boss。用游戏化的方式发布每日任务，带进度条和成就系统感。' },
  ];

  useEffect(() => {
    setApiKey(localStorage.getItem('ai_api_key') || '');
    setModel(localStorage.getItem('ai_model') || 'qwen-plus');
    setAiPrompt(localStorage.getItem('ai_prompt') || defaultPrompt);
  }, []);

  // 根据模型判断激活的 AI 名称
  const activeProvider = (() => {
    if (!apiKey) return null;
    if (model.startsWith('qwen')) return '千问';
    if (model.startsWith('deepseek')) return 'DeepSeek';
    return 'AI';
  })();

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('ai_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('ai_api_key');
    }
    localStorage.setItem('ai_model', model);
    localStorage.setItem('ai_prompt', aiPrompt.trim() || defaultPrompt);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-in max-w-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">设置</h2>
        <p className="text-sm text-gray-400 mt-1">AI 模型与 API Key 管理</p>
      </div>

      {/* 安全提示 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-2">
          <Shield size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-700">
            <p className="font-medium mb-1">安全说明</p>
            <p className="text-xs text-amber-600">
              API Key 仅保存在你的浏览器本地存储中，不会上传到任何服务器。
              关闭此页面后数据仍保留，清除浏览器数据会丢失。
            </p>
          </div>
        </div>
      </div>

      {/* API Key */}
      <div className="glass-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Key size={18} className="text-blue-500" />
          <h3 className="font-semibold text-gray-700">API Key</h3>
          {activeProvider && (
            <span className="ml-auto text-[10px] bg-gradient-to-r from-green-400 to-emerald-500 text-white px-2.5 py-0.5 rounded-full font-medium">
              {activeProvider} 已激活
            </span>
          )}
        </div>
        {apiKey ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-xs text-gray-400 select-none" style={{ userSelect: 'none' }}>
              {apiKey.slice(0, 8)}••••••••••••••••
            </div>
            <button onClick={() => { setApiKey(''); localStorage.removeItem('ai_api_key'); }}
              className="px-3 py-2.5 text-xs text-red-400 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0">
              清除
            </button>
          </div>
        ) : (
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="输入 API Key（千问/DeepSeek）"
            autoComplete="off"
            style={{ userSelect: 'none' }}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 mb-2 select-none"
          />
        )}
        <p className="text-[10px] text-gray-400 mt-2">千问：dashscope.aliyun.com · DeepSeek：platform.deepseek.com</p>
      </div>

      {/* 模型选择 */}
      <div className="glass-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Cpu size={18} className="text-purple-500" />
          <h3 className="font-semibold text-gray-700">AI 模型</h3>
        </div>
        <div className="space-y-2">
          {PRESET_MODELS.map(m => (
            <label key={m.id}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                model === m.id ? 'border-blue-300 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
              }`}>
              <input
                type="radio" name="model" value={m.id}
                checked={model === m.id}
                onChange={e => setModel(e.target.value)}
                className="text-blue-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">{m.name}</div>
                <div className="text-xs text-gray-400">{m.desc}</div>
              </div>
              <span className="text-[10px] text-gray-400">{m.id}</span>
            </label>
          ))}
        </div>
      </div>

      {/* AI 风格 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={18} className="text-green-500" />
          <h3 className="font-semibold text-gray-700">AI 风格</h3>
          <button onClick={() => setAiPrompt(defaultPrompt)}
            className="ml-auto text-xs text-blue-500 hover:underline">恢复默认</button>
        </div>
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {presetPrompts.map(p => (
            <button key={p.label} onClick={() => setAiPrompt(p.prompt)}
              className="text-[10px] px-2 py-1 bg-gray-100 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors">
              {p.label}
            </button>
          ))}
        </div>
        <textarea
          value={aiPrompt}
          onChange={e => setAiPrompt(e.target.value)}
          rows={3}
          placeholder={defaultPrompt}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
        />
        <p className="text-[10px] text-gray-400 mt-1">自定义 AI 生成每日建议的风格和语气</p>
      </div>

      {/* 背景板 */}
      <div className="glass-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Image size={18} className="text-pink-500" />
          <h3 className="font-semibold text-gray-700">背景板</h3>
          {bgImage && <span className="text-[10px] text-green-500 ml-auto bg-green-50 px-2 py-0.5 rounded-full">已自定义</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => bgRef.current?.click()}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all">
            {bgImage ? '更换图片' : '上传图片'}
          </button>
          {bgImage && (
            <button onClick={() => { setBgImage(''); localStorage.removeItem('bg_image'); document.body.classList.remove('custom-bg'); document.body.style.removeProperty('background'); }}
              className="px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-50 transition-all">
              恢复默认
            </button>
          )}
          <input ref={bgRef} type="file" accept="image/*" className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onload = () => {
                const b64 = reader.result as string;
                setBgImage(b64);
                localStorage.setItem('bg_image', b64);
                document.body.classList.add('custom-bg');
                document.body.style.setProperty('background', `url(${b64}) center/cover fixed no-repeat`, 'important');
              };
              reader.readAsDataURL(f);
            }} />
        </div>
        {bgImage && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400 flex-shrink-0 w-16">背景暗度</span>
              <input type="range" min="0" max="70" value={Math.round(bgOpacity * 100)} step="5"
                onChange={e => updateBgOpacity(Number(e.target.value) / 100)}
                className="flex-1 h-1 accent-slate-500" />
              <span className="text-[10px] text-gray-500 w-8 text-right">{Math.round(bgOpacity * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400 flex-shrink-0 w-16">面板透明</span>
              <input type="range" min="5" max="90" value={Math.round(uiOpacity * 100)} step="5"
                onChange={e => updateUiOpacity(Number(e.target.value) / 100)}
                className="flex-1 h-1 accent-blue-500" />
              <span className="text-[10px] text-gray-500 w-8 text-right">{Math.round(uiOpacity * 100)}%</span>
            </div>
          </div>
        )}
        <p className="text-[10px] text-gray-400 mt-2">上传一张图片作为应用背景</p>
      </div>

      {/* 按钮 */}
      <div className="flex gap-2">
        <button onClick={handleSave}
          className="flex-1 btn-primary py-2.5 text-sm">
          {saved ? '已保存 ✓' : '保存设置'}
        </button>
      </div>
    </div>
  );
}
