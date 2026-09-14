import { useState } from "react";

export function useDrawer<T = any>() {
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState<T | null>(null);
	const [callback, setCallback] = useState<((val?: any) => void) | null>(null);

	const openDrawer = (data?: T, onClose?: (val?: any) => void) => {
		setData(data || null);
		setCallback(() => onClose || null);
		setVisible(true);
	};

	const closeDrawer = (result?: any) => {
		setVisible(false);
		if (callback) callback(result);
	};

	return {
		visible,
		data,
		openDrawer,
		closeDrawer,
	};
}
