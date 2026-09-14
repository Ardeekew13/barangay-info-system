import { RuleObject } from "antd/es/form";
import { FormInstance } from "antd/lib";

// TODO: Implement GraphQL validation queries
export const validateEmailUniqueness = async (
	_: RuleObject,
	value: string
): Promise<void> => {
	if (!value) return Promise.resolve();

	// Email validation temporarily disabled - needs GraphQL implementation
	// TODO: Create GraphQL query for email uniqueness check
	return Promise.resolve();
	
	/* Original REST API implementation - to be replaced with GraphQL
	try {
		const { data } = await axios.get(
			"http://localhost:5001/api/resident/validate/check-email",
			{ params: { email: value.trim() } }
		);

		if (data.exists) {
			return Promise.reject(new Error("This email is already registered."));
		}

		return Promise.resolve();
	} catch (err: any) {
		console.error("Validator error:", err.response?.data || err.message);
		return Promise.reject(
			new Error("Failed to validate email. Please try again.")
		);
	}
	*/
};

export const validateResidentDuplicate =
	(form: FormInstance) =>
	async (_: RuleObject, value: any): Promise<void> => {
		const firstName = form.getFieldValue("first_name");
		const middleName = form.getFieldValue("middle_name");
		const lastName = form.getFieldValue("last_name");

		if (!firstName || !middleName || !lastName) {
			return Promise.resolve();
		}

		// Duplicate check temporarily disabled - needs GraphQL implementation
		// TODO: Create GraphQL query for resident duplicate check
		return Promise.resolve();

		/* Original REST API implementation - to be replaced with GraphQL
		try {
			const { data } = await axios.get(
				"http://localhost:5001/api/resident/validate/check-resident",
				{
					params: {
						first_name: firstName,
						middle_name: middleName,
						last_name: lastName,
					},
				}
			);

			if (data.exists) {
				return Promise.reject(
					new Error("Resident with the same name already exists.")
				);
			}

			return Promise.resolve();
		} catch (err) {
			console.error("Duplicate check error:", err);
			return Promise.reject(new Error("Failed to validate resident."));
		}
		*/
	};
