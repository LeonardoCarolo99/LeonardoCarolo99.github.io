// Navbar HTML content
const navbarHTML = `
<header class="main-navbar">
  <div class="logo">LEONARDO CARÔLO</div>
  <nav class="nav-links">
    <a href="REDESIGN/index.html" id="nav-home">Home</a>
    <a href="REDESIGN/about.html" id="nav-about">About Me</a>
    <!-- <a href="REDESIGN/booking.html" id="nav-booking">Booking</a> -->
    <a href="REDESIGN/contacts.html" id="nav-contacts">Contacts</a>
  </nav>
</header>
`;

// Load navbar into pages
document.addEventListener('DOMContentLoaded', function() {
  const navContainer = document.getElementById('navbar-container');
  if (navContainer) {
    navContainer.innerHTML = navbarHTML;
    setActiveNavLink();
  }
});

// Set active nav link based on current page
function setActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'REDESIGN/index.html';
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}
