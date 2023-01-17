export function truncate(value: string, maxlength: number) {
	return value.length > maxlength ? value.slice(0, maxlength - 1) + '…' : value;
}
