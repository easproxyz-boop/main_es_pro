import './style.css';

document.querySelector('#app').innerHTML = `
  <div class="not-found-container">
    <h1>404</h1>
    <h2>Oops! Page Doesn't Exist</h2>
    <p>The page you are looking for might have been removed or the URL is incorrect.</p>
    <a href="/sign-in" class="home-link">Back to sign-in</a>
  </div>
`;
