import { useState, useEffect } from 'react';
import { Key, Shield, Cpu, MessageSquare } from 'lucide-react';

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

  const defaultPrompt = '你是一个友好的校园助手，像学长/学姐一样给我提建议。根据今天的课程和事件，生成3-5条简短建议。';

  useEffect(() => {
    setApiKey(localStorage.getItem('ai_api_key') || '');
    setModel(localStorage.getItem('ai_model') || 'qwen-plus');
    setAiPrompt(localStorage.getItem('ai_prompt') || defaultPrompt);
  }, []);

  const handleSave = () => {
    localStorage.setItem('ai_api_key', apiKey.trim());
    localStorage.setItem('ai_model', model);
    localStorage.setItem('ai_prompt', aiPrompt.trim() || defaultPrompt);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    localStorage.removeItem('ai_api_key');
    setApiKey('');
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Key size={18} className="text-blue-500" />
          <h3 className="font-semibold text-gray-700">API Key</h3>
        </div>
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="输入你的 API Key（支持千问/DeepSeek 等）"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 mb-2"
        />
        <p className="text-xs text-gray-400">
          千问：dashscope.aliyun.com · DeepSeek：platform.deepseek.com
        </p>
      </div>

      {/* 模型选择 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
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
        <textarea
          value={aiPrompt}
          onChange={e => setAiPrompt(e.target.value)}
          rows={3}
          placeholder={defaultPrompt}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
        />
        <p className="text-[10px] text-gray-400 mt-1">自定义 AI 生成每日建议的风格和语气</p>
      </div>

      {/* 按钮 */}
      <div className="flex gap-2">
        <button onClick={handleSave}
          className="flex-1 bg-blue-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
          {saved ? '已保存 ✓' : '保存设置'}
        </button>
        <button onClick={handleClear}
          className="px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors">
          清除 Key
        </button>
      </div>
    </div>
  );
}
