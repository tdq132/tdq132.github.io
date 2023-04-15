
// Mode Switcher script by Derek Kedziora
// https://github.com/derekkedziora/jekyll-demo


// Adapted by myself to show an icon to switch between themes
// Light mode icon from - https://www.flaticon.com/free-icon/sun_5915194
// Dark mode icon from - https://www.flaticon.com/free-icon/brightness_8637690


let systemInitiatedDark = window.matchMedia("(prefers-color-scheme: dark)"); 
let theme = sessionStorage.getItem('theme');

if (systemInitiatedDark.matches) {
	document.documentElement.setAttribute('data-theme', 'dark');
	document.getElementById("theme-toggle").innerHTML = "<img src=\"/assets/light-mode.png\" width=25px height=25px>";
} else {
	document.documentElement.setAttribute('data-theme', 'light');
	document.getElementById("theme-toggle").innerHTML = "<img src=\"/assets/dark-mode.png\" width=25px height=25px>";
}

function prefersColorTest(systemInitiatedDark) {
  if (systemInitiatedDark.matches) {
  	document.documentElement.setAttribute('data-theme', 'dark');		
   	document.getElementById("theme-toggle").innerHTML = "<img src=\"/assets/light-mode.png\" width=25px height=25px>";
   	sessionStorage.setItem('theme', '');
  } else {
  	document.documentElement.setAttribute('data-theme', 'light');
    document.getElementById("theme-toggle").innerHTML = "<img src=\"/assets/dark-mode.png\" width=25px height=25px>";
    sessionStorage.setItem('theme', '');
  }
}
systemInitiatedDark.addListener(prefersColorTest);


function modeSwitcher() {
	let theme = sessionStorage.getItem('theme');
	if (theme === "dark") {
		document.documentElement.setAttribute('data-theme', 'light');
		sessionStorage.setItem('theme', 'light');
		document.getElementById("theme-toggle").innerHTML = "<img src=\"/assets/dark-mode.png\" width=25px height=25px>";
	}	else if (theme === "light") {
		document.documentElement.setAttribute('data-theme', 'dark');
		sessionStorage.setItem('theme', 'dark');
		document.getElementById("theme-toggle").innerHTML = "<img src=\"/assets/light-mode.png\" width=25px height=25px>";
	} else if (systemInitiatedDark.matches) {	
		document.documentElement.setAttribute('data-theme', 'light');
		sessionStorage.setItem('theme', 'light');
		document.getElementById("theme-toggle").innerHTML = "<img src=\"/assets/dark-mode.png\" width=25px height=25px>";
	} else {
		document.documentElement.setAttribute('data-theme', 'dark');
		sessionStorage.setItem('theme', 'dark');
		document.getElementById("theme-toggle").innerHTML = "<img src=\"/assets/light-mode.png\" width=25px height=25px>";
	}
}

if (theme === "dark") {
	document.documentElement.setAttribute('data-theme', 'dark');
	sessionStorage.setItem('theme', 'dark');
	document.getElementById("theme-toggle").innerHTML = "<img src=\"/assets/light-mode.png\" width=25px height=25px>";
} else if (theme === "light") {
	document.documentElement.setAttribute('data-theme', 'light');
	sessionStorage.setItem('theme', 'light');
	document.getElementById("theme-toggle").innerHTML = "<img src=\"/assets/dark-mode.png\" width=25px height=25px>";
}