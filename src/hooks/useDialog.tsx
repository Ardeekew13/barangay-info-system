import React, { useCallback, useRef, useState } from "react";
import { useModal } from "react-modal-hook";

export const useDialog = (Component: React.FC<any>) => {
	const [modalProps, setModalProps] = useState<any>({});
	const onCloseRef = useRef<any>(null);
	
	const [showModal, hideModal] = useModal(
		() => (
			<Component
				{...modalProps}
				hide={(result?: any) => {
					hideModal();
					onCloseRef.current?.(result);
				}}
			/>
		),
		[modalProps]
	);

	const openDialog = useCallback(
		(props: any = {}, onClose?: (result?: any) => void) => {
			onCloseRef.current = onClose;
			setModalProps(props);
			showModal();
		},
		[showModal]
	);

	return openDialog;
};
