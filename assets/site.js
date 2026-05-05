const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");
const menuClose = document.getElementById("menuClose");

menuToggle.addEventListener("click", () => {
    mobileNav.classList.add("open");
});

menuClose.addEventListener("click", () => {
    mobileNav.classList.remove("open");
});

// Login modal functionality
(function(){
  var loginModal = null, loginInput = null, loginBtn = null, closeBtn = null;

  function initLoginModal() {
    if (!document.getElementById('loginModal')) {
      var modal = document.createElement('div');
      modal.id = 'loginModal';
      modal.className = 'login-modal';
      modal.innerHTML = '<div class="login-modal-content"><div class="login-modal-header"><h2>Sign in to Upload</h2><button class="login-modal-close">&times;</button></div><form id="loginForm"><input type="password" id="loginPassword" placeholder="Password" required><button type="submit">Sign in</button><div id="loginError"></div></form></div>';
      document.body.appendChild(modal);
    }

    loginModal = document.getElementById('loginModal');
    loginInput = document.getElementById('loginPassword');
    loginBtn = document.getElementById('loginForm');
    closeBtn = loginModal.querySelector('.login-modal-close');

    if (closeBtn) closeBtn.addEventListener('click', closeLoginModal);
    loginModal.addEventListener('click', function(e) {
      if (e.target === loginModal) closeLoginModal();
    });

    if (loginBtn) loginBtn.addEventListener('submit', function(e) {
      e.preventDefault();
      submitLogin();
    });

    document.querySelectorAll('a[href="/login.html"], a[href="login.html"]').forEach(function(link) {
      link.href = '#';
      link.addEventListener('click', function(e) {
        e.preventDefault();
        openLoginModal();
      });
    });
  }

  function openLoginModal() {
    if (loginModal) {
      loginModal.style.display = 'flex';
      if (loginInput) loginInput.focus();
      document.getElementById('loginError').innerHTML = '';
    }
  }

  function closeLoginModal() {
    if (loginModal) {
      loginModal.style.display = 'none';
      if (loginInput) loginInput.value = '';
    }
  }

  function submitLogin() {
    var password = loginInput.value;
    var errorDiv = document.getElementById('loginError');
    errorDiv.innerHTML = '';

    fetch('/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: 'password=' + encodeURIComponent(password),
      credentials: 'same-origin',
      redirect: 'follow'
    }).then(function(r) {
      return fetch('/auth-status', {credentials: 'same-origin'}).then(function(authResp) {
        return authResp.json();
      });
    }).then(function(j) {
      if (j && j.authenticated) {
        document.body.classList.add('can-upload');
        errorDiv.innerHTML = '<p style="color:green;">Login successful!</p>';
        setTimeout(function() { closeLoginModal(); }, 800);
      } else {
        errorDiv.innerHTML = '<p style="color:red;">Invalid password</p>';
      }
    }).catch(function(err) {
      console.error('Login error:', err);
      errorDiv.innerHTML = '<p style="color:red;">Login error - please try again</p>';
    });
  }

  fetch('/auth-status', {credentials: 'same-origin'}).then(function(r){return r.json()}).then(function(j){ if(j && j.authenticated){ document.body.classList.add('can-upload'); } }).catch(function(){});

  // Upload functionality
  function sendFile(file){var fd=new FormData();fd.append('image',file);return fetch('/upload',{method:'POST',body:fd}).then(function(r){return r.json()})}
  document.querySelectorAll('.uploader').forEach(function(input){
    var btn=input.parentNode.querySelector('.upload-btn');
    var img=input.closest('a')&&input.closest('a').querySelector('img');
    input.addEventListener('change',function(){
      var f=this.files&&this.files[0]; if(!f) return; btn.textContent='Uploading...';btn.disabled=true;
      sendFile(f).then(function(res){if(res&&res.file){if(img) img.src=res.file+'?t='+Date.now(); var parent=input.closest('a'); parent&&parent.setAttribute('data-src',res.file);}else alert('Upload failed')}).catch(function(){alert('Upload failed')}).finally(function(){btn.textContent='Upload';btn.disabled=false;input.value=''});
    });
    if(btn){btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();input.click()});}
  });

  // Inline editing functionality
  function enableInlineEditing(){
    if(!document.body.classList.contains('can-upload')) return;

    // Handle image description editing
    document.querySelectorAll('.image-description').forEach(function(desc){
      var editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.className = 'edit-btn';
      desc.appendChild(editBtn);
      editBtn.addEventListener('click', function(e){
        e.stopPropagation();
        if(desc.classList.contains('editing')) return;
        desc.classList.add('editing');
        var pElem = desc.querySelector('p');
        var textarea = document.createElement('textarea');
        textarea.value = pElem.textContent;
        var saveBtn = document.createElement('button');
        saveBtn.className = 'save-btn';
        saveBtn.textContent = 'Save';
        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = 'Cancel';
        desc.insertBefore(textarea, editBtn);
        desc.insertBefore(saveBtn, editBtn);
        desc.insertBefore(cancelBtn, editBtn);
        saveBtn.addEventListener('click', function(e){
          e.stopPropagation();
          var id = pElem.getAttribute('data-editable-id');
          fetch('/admin/save-snippet',{
            method:'POST',
            body:JSON.stringify({
              path:location.pathname.replace(/^\//,'')||'index.html',
              id:id,
              content:textarea.value
            }),
            headers:{'Content-Type':'application/json'}
          }).then(r=>r.json()).then(function(j){
            if(j && j.ok){
              pElem.textContent = textarea.value;
              desc.classList.remove('editing');
              textarea.remove();
              saveBtn.remove();
              cancelBtn.remove();
            } else alert('Save failed: '+(j&&j.error));
          }).catch(function(){ alert('Save failed') });
        });
        cancelBtn.addEventListener('click', function(e){
          e.stopPropagation();
          desc.classList.remove('editing');
          textarea.remove();
          saveBtn.remove();
          cancelBtn.remove();
        });
      });
    });

    // Handle page description sections editing
    document.querySelectorAll('.page-description').forEach(function(sec){
      var editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.className = 'edit-btn';
      sec.appendChild(editBtn);
      editBtn.addEventListener('click', function(e){
        e.stopPropagation();
        if(sec.classList.contains('editing')) return;
        sec.classList.add('editing');
        var pElem = sec.querySelector('p');
        var textarea = document.createElement('textarea');
        textarea.value = pElem.textContent;
        var saveBtn = document.createElement('button');
        saveBtn.className = 'save-btn';
        saveBtn.textContent = 'Save';
        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = 'Cancel';
        sec.insertBefore(textarea, editBtn);
        sec.insertBefore(saveBtn, editBtn);
        sec.insertBefore(cancelBtn, editBtn);
        saveBtn.addEventListener('click', function(e){
          e.stopPropagation();
          var id = pElem.getAttribute('data-editable-id');
          fetch('/admin/save-snippet',{
            method:'POST',
            body:JSON.stringify({
              path:location.pathname.replace(/^\//,'')||'index.html',
              id:id,
              content:textarea.value
            }),
            headers:{'Content-Type':'application/json'}
          }).then(r=>r.json()).then(function(j){
            if(j && j.ok){
              pElem.textContent = textarea.value;
              sec.classList.remove('editing');
              textarea.remove();
              saveBtn.remove();
              cancelBtn.remove();
            } else alert('Save failed: '+(j&&j.error));
          }).catch(function(){ alert('Save failed') });
        });
        cancelBtn.addEventListener('click', function(e){
          e.stopPropagation();
          sec.classList.remove('editing');
          textarea.remove();
          saveBtn.remove();
          cancelBtn.remove();
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    enableInlineEditing();
    initLoginModal();
  });
})();
