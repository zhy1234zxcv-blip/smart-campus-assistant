import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import App from './App'
import './index.css'

// 加载自定义背景
const bg = localStorage.getItem('bg_image');
if (bg) {
  document.body.classList.add('custom-bg');
  document.body.style.setProperty('background', `url(${bg}) center/cover fixed no-repeat`, 'important');
  document.documentElement.style.setProperty('--bg-opacity', localStorage.getItem('bg_opacity') || '0');
  document.documentElement.style.setProperty('--ui-opacity', localStorage.getItem('ui_opacity') || '0.18');
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <DataProvider>
      <App />
    </DataProvider>
  </BrowserRouter>
)
