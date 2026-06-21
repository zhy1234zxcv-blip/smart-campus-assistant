/*
 * 天气服务
 * 数据源：Open-Meteo 免费 API（无需 Key）
 * 地点：宁波工程学院 (29.86°N, 121.55°E)
 * 每天返回昨天+今天+明天+后天 + 逐小时预报
 * WMO 天气码映射为中文 + emoji
 */
// 宁波工程学院坐标
const LAT = 29.86;
const LON = 121.55;
const LOCATION = '宁波工程学院';

// WMO 天气码映射
const WEATHER_MAP: Record<number, { icon: string; label: string }> = {
  0: { icon: '☀️', label: '晴' },
  1: { icon: '🌤️', label: '少云' },
  2: { icon: '⛅', label: '多云' },
  3: { icon: '☁️', label: '阴' },
  45: { icon: '🌫️', label: '雾' },
  48: { icon: '🌫️', label: '雾凇' },
  51: { icon: '🌦️', label: '小雨' },
  53: { icon: '🌦️', label: '中雨' },
  55: { icon: '🌧️', label: '大雨' },
  61: { icon: '🌧️', label: '阵雨' },
  63: { icon: '🌧️', label: '中阵雨' },
  65: { icon: '🌧️', label: '大阵雨' },
  71: { icon: '🌨️', label: '小雪' },
  73: { icon: '🌨️', label: '中雪' },
  75: { icon: '❄️', label: '大雪' },
  80: { icon: '🌦️', label: '阵雨' },
  81: { icon: '🌧️', label: '中阵雨' },
  82: { icon: '⛈️', label: '大阵雨' },
  95: { icon: '⛈️', label: '雷阵雨' },
  96: { icon: '⛈️', label: '雷暴' },
  99: { icon: '⛈️', label: '强雷暴' }
};

export interface DailyWeather {
  date: string;
  maxTemp: number;
  minTemp: number;
  code: number;
  icon: string;
  label: string;
  rainProb: number;
}

export interface HourlyWeather {
  time: string;
  temp: number;
  code: number;
  icon: string;
  label: string;
  rainProb: number;
}

export interface WeatherData {
  location: string;
  daily: DailyWeather[];
  hourly: HourlyWeather[];
}

export async function fetchWeather(): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&hourly=temperature_2m,weathercode,precipitation_probability&timezone=Asia/Shanghai&forecast_days=4&past_days=1`;

  const res = await fetch(url);
  const data = await res.json();

  const daily: DailyWeather[] = data.daily.time.map((t: string, i: number) => {
    const code = data.daily.weathercode[i];
    const w = WEATHER_MAP[code] || { icon: '❓', label: '未知' };
    return {
      date: t,
      maxTemp: Math.round(data.daily.temperature_2m_max[i]),
      minTemp: Math.round(data.daily.temperature_2m_min[i]),
      code,
      icon: w.icon,
      label: w.label,
      rainProb: data.daily.precipitation_probability_max[i] || 0
    };
  });

  const hourly: HourlyWeather[] = data.hourly.time.map((t: string, i: number) => {
    const code = data.hourly.weathercode[i];
    const w = WEATHER_MAP[code] || { icon: '❓', label: '未知' };
    return {
      time: t,
      temp: Math.round(data.hourly.temperature_2m[i]),
      code,
      icon: w.icon,
      label: w.label,
      rainProb: data.hourly.precipitation_probability[i] || 0
    };
  });

  return { location: LOCATION, daily, hourly };
}
