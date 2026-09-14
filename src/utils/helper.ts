import dayjs from "dayjs";

export const getAge = (birthday: string) => {
	const birth = dayjs(birthday);
	const today = dayjs();

	let age = today.year() - birth.year();
	if (
		today.month() < birth.month() ||
		(today.month() === birth.month() && today.date() < birth.date())
	) {
		age--;
	}

	return age;
};
