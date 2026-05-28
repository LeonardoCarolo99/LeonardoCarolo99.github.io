// Navbar HTML content
const navbarHTML = `
<header class="main-navbar">
  <div class="logo">LEONARDO CARÔLO</div>
  <nav class="nav-links">
    <a href="types.html" id="nav-home">Home</a>
    <a href="about.html" id="nav-about">About Me</a>
    <!-- <a href="booking.html" id="nav-booking">Booking</a> -->
    <a href="contacts.html" id="nav-contacts">Contacts</a>
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
  const currentPage = window.location.pathname.split('/').pop() || 'types.html';
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}
