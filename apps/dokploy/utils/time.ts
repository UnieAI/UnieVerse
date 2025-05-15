	export const toDatetimeLocalString = (date: Date) => {
		const pad = (n: number) => n.toString().padStart(2, "0");

		const yyyy = date.getFullYear();
		const MM = pad(date.getMonth() + 1); // 月份從 0 開始
		const dd = pad(date.getDate());
		const hh = pad(date.getHours());
		const mm = pad(date.getMinutes());

		return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
	}