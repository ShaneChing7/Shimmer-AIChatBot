export const SET_MODEL = (model: string) => {
	localStorage.setItem('MODEL', model)
}
export const GET_MODEL = () => {
	return localStorage.getItem('MODEL')
}
export const REMOVE_MODEL = () => {
	return localStorage.removeItem('MODEL')
}
