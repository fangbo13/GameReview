
/* logout.js */

import { customiseNavbar, loadPage, showMessage } from '../util.js'

export async function setup(node) {
	try {
		console.log('LOGOUT: setup')
		customiseNavbar(['home', 'login'])
		node.querySelectorAll('button').forEach( button => button.addEventListener('click', event => {
			console.log(event.target.innerText)
			if(event.target.innerText === 'OK') {
				localStorage.removeItem('username')
				localStorage.removeItem('authorization')
				loadPage('login')
				showMessage('you are logged out')
			} else {
				loadPage('home')
			}
		}))
	} catch(err) {
		console.error(err)
	}
}
