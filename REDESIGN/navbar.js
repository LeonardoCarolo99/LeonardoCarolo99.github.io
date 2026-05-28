// Smart path calculation based on where the user is currently browsing
const isInsideRedesign = window.location.pathname.includes('/REDESIGN/');
const toRoot = isInsideRedesign ? '../' : './';
const toRedesign = isInsideRedesign ? './' : 'REDESIGN/';

// Navbar HTML content using dynamic variables
const navbarHTML = `
<header class="main-navbar">
  <div class="logo">LEONARDO CARÔLO</div>
  <nav class="nav-links">
    <a href="${toRoot}index.html" id="nav-home">Home</a>
    <a href="${toRedesign}about.html" id="nav-about">About Me</a>
    <a href="${toRedesign}contacts.html" id="nav-contacts">Contacts</a>
  </nav>
</header>
`;

// Load navbar into pages
document.addEventListener('DOMContentLoaded', function() {
  const navContainer = document.getElementById('navbar-container'); //
  if (navContainer) { //[cite: 1]
    navContainer.innerHTML = navbarHTML; //[cite: 1]
    setActiveNavLink();
  }
});

// Set active nav link based on current page
function setActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    
    // Extract just the filename from the href attribute to compare cleanly
    const linkPage = link.getAttribute('href').split('/').pop();
    
    if (linkPage === currentPage) {
      link.classList.add('active');
    }
  });
}