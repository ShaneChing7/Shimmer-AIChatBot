import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";    
import relativeTime from "dayjs/plugin/relativeTime";
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';
dayjs.extend(utc);    
dayjs.extend(relativeTime);

export const  formatSessionTime = (isoString:string) => {
  const date = dayjs(isoString).local();
  const diffMinutes = dayjs().diff(date, 'minute');

  // 如果是一天内，就显示“几小时前”
  if (diffMinutes < 60 * 24) {
    return date.fromNow();
  } else {
    // 否则显示日期+时间
    return date.format("MM-DD HH:mm");
  }
}

export const  getTimeKey = ()  => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 9) return 'morning'
  if (hour >= 9 && hour < 12) return 'lateMorning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'evening'
}

