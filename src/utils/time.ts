import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";    
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

dayjs.extend(utc);    
dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

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

export const getTime = () => {
	let message = ''
	const hours = new Date().getHours()
	if (hours <= 9) {
		message = '早上'
	} else if (hours <= 12) {
		message = '上午'
	} else if (hours <= 18) {
		message = '下午'
	} else {
		message = '晚上'
	}
	return message
}
