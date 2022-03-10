
/* login.js */

import { createToken, customiseNavbar, secureGet, loadPage, showMessage } from '../util.js'

export async function setup(node) {
	try {
		console.log('LOGIN: setup')
		customiseNavbar(['home', 'login'])
		console.log(node.querySelector('.toggle-password'))
		node.querySelector('.toggle-password').addEventListener('click', await toggle)
		node.querySelector('form').addEventListener('submit', await login)
	} catch(err) {
		console.error(err)
	}
}

async function login() {
	event.preventDefault()
	console.log('form submitted')
	const formData = new FormData(event.target)
	const data = Object.fromEntries(formData.entries())
	const token = 'Basic ' + btoa(`${data.user}:${data.pass}`)
	console.log('making call to secureGet')
	const response = await secureGet('/api/users', token)
	console.log(response)
	if(response.status === 200) {
		localStorage.setItem('username', response.json.data.username)
		localStorage.setItem('authorization', response.json.data.token)
		showMessage(`you are logged in as ${response.json.data.username}`)
		await loadPage('home')
	} else {
		document.querySelector('input[name="pass"]').value = ''
		showMessage(response.json.errors[0].detail)
	}
}

async function toggle() {
	console.log(event.target)
	event.target.toggleClass("fa-eye fa-eye-slash");
	let input = togglePassword.attr("toggle");
	if (input.attr("type") == "password") {
	input.attr("type", "text");
	} else {
	input.attr("type", "password");
	}
}