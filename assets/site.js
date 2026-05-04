(function(){
  // Modal login management
  var loginModal = null, loginInput = null, loginBtn = null, closeBtn = null;
  
  function initLoginModal() {
    // Create modal if it doesn't exist
    if (!document.getElementById('loginModal')) {
      var modal = document.createElement('div');
      modal.id = 'loginModal';
      modal.className = 'login-modal';
      modal.innerHTML = '<div class=\"login-modal-content\"><div class=\"login-modal-header\"><h2>Sign in to Upload</h2><button class=\"login-modal-close\">&times;</button></div><form id=\"loginForm\"><input type=\"password\" id=\"loginPassword\" placeholder=\"Password\" required><button type=\"submit\">Sign in</button><div id=\"loginError\"></div></form></div>';
      document.body.appendChild(modal);
    }
    
    loginModal = document.getElementById('loginModal');
    loginInput = document.getElementById('loginPassword');
    loginBtn = document.getElementById('loginForm');
    closeBtn = loginModal.querySelector('.login-modal-close');
    
    // Close button
    if (closeBtn) closeBtn.addEventListener('click', closeLoginModal);
    
    // Click outside modal to close
    loginModal.addEventListener('click', function(e) {
      if (e.target === loginModal) closeLoginModal();
    });
    
    // Form submit
    if (loginBtn) loginBtn.addEventListener('submit', function(e) {
      e.preventDefault();
      submitLogin();
    });
    
    // Login links
    document.querySelectorAll('a[href=\"/login.html\"], a[href=\"login.html\"]').forEach(function(link) {
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
      // After successful login attempt, check auth status
      return fetch('/auth-status', {credentials: 'same-origin'}).then(function(authResp) {
        return authResp.json();
      });
    }).then(function(j) {
      if (j && j.authenticated) {
        document.body.classList.add('can-upload');
        errorDiv.innerHTML = '<p style=\"color:green;\">Login successful!</p>';
        setTimeout(function() { closeLoginModal(); }, 800);
      } else {
        errorDiv.innerHTML = '<p style=\"color:red;\">Invalid password</p>';
      }
    }).catch(function(err) {
      console.error('Login error:', err);
      errorDiv.innerHTML = '<p style=\"color:red;\">Login error - please try again</p>';
  fetch('/auth-status', {credentials: 'same-origin'}).then(function(r){return r.json()}).then(function(j){ if(j && j.authenticated){ document.body.classList.add('can-upload'); } }).catch(function(){});
  document.addEventListener('contextmenu',function(e){if(e.target.tagName==='IMG'||e.target.id==='lightboxInner')e.preventDefault()});
  document.addEventListener('dragstart',function(e){if(e.target.tagName==='IMG')e.preventDefault()});
  // open lightbox when clicking gallery item (uses data-src)
  document.querySelectorAll('.gallery .item, .image-grid a').forEach(function(el){el.addEventListener('click',function(ev){
    // skip if click came from upload button
    if(ev.target.closest('.upload-wrap')) return;
    var src=el.getAttribute('data-src')||el.querySelector('img')&&el.querySelector('img').src; if(!src) return;
    if(lightbox&&lbInner){lbInner.style.backgroundImage='url(\"'+src+'\")';lightbox.style.display='flex'}
  })});
  if(lbClose) lbClose.addEventListener('click',function(){if(lightbox){lightbox.style.display='none';lbInner.style.backgroundImage=''}});
  if(lightbox) lightbox.addEventListener('click',function(e){if(e.target===lightbox){lightbox.style.display='none';lbInner.style.backgroundImage=''}});
  // uploads
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
  // inline editable blocks for admins (elements wrapped with markers on server)
  function enableInlineEditing(){
    if(!document.body.classList.contains('can-upload')) return;
    document.querySelectorAll('[data-editable-id]').forEach(function(el){
      var id=el.getAttribute('data-editable-id');
      var wrap=document.createElement('div'); wrap.style.position='relative';
      var btn=document.createElement('button'); btn.textContent='Edit'; btn.style.position='absolute'; btn.style.top='6px'; btn.style.right='6px'; btn.style.zIndex=80; btn.className='small-edit-btn';
      btn.addEventListener('click', function(e){ e.stopPropagation(); var ta=document.createElement('textarea'); ta.style.width='100%'; ta.style.minHeight='120px'; ta.value=el.innerHTML; var save=document.createElement('button'); save.textContent='Save'; save.style.marginTop='6px'; var cancel=document.createElement('button'); cancel.textContent='Cancel'; cancel.style.margin='6px'; var holder=document.createElement('div'); holder.appendChild(ta); holder.appendChild(save); holder.appendChild(cancel); el.style.display='none'; el.parentNode.insertBefore(holder, el);
      save.addEventListener('click', function(){ fetch('/admin/save-snippet',{method:'POST',body:JSON.stringify({path:location.pathname.replace(/^\//,'')||'index.html',id:id,content:ta.value}),headers:{'Content-Type':'application/json'}}).then(r=>r.json()).then(function(j){ if(j && j.ok){ el.innerHTML=ta.value; holder.parentNode.removeChild(holder); el.style.display='block'; } else alert('Save failed: '+(j&&j.error)); }).catch(function(){ alert('Save failed') }); });
      cancel.addEventListener('click', function(){ holder.parentNode.removeChild(holder); el.style.display='block'; });
      });
      el.parentNode.insertBefore(wrap, el); wrap.appendChild(el); wrap.appendChild(btn);
    });
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
    // Menu toggle
    var menuToggle = document.getElementById('menuToggle');
    var mobileNav = document.getElementById('mobileNav');
    if(menuToggle && mobileNav){
      menuToggle.addEventListener('click', function(){
        mobileNav.classList.toggle('open');
      });
    }
    var menuClose = document.getElementById('menuClose');
    if(menuClose){
      menuClose.addEventListener('click', function(){
        mobileNav.classList.remove('open');
      });
    }
  });
})();

/* Video gallery manager (YouTube links) */
(function(){
  var KEY = 'jenny_videos_v1';
  function parseYouTubeId(url){
    if(!url) return null;
    var m = url.match(/(?:v=|\/v\/|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,11})/);
    return m ? m[1] : null;
  }
  function thumbFor(id){ return id ? 'https://img.youtube.com/vi/'+id+'/hqdefault.jpg' : '' }
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY))||[] }catch(e){return[]} }
  function save(v){ localStorage.setItem(KEY, JSON.stringify(v||[])); }
  function createCard(v,i){
    var card = document.createElement('div'); card.className='video-card';
    var thumb = document.createElement('div'); thumb.className='video-thumb'; thumb.style.backgroundImage = v.id ? 'url(\"'+thumbFor(v.id)+'\")' : 'linear-gradient(180deg,#eee,#ddd)';
    var info = document.createElement('div'); info.className='video-info';
    var title = document.createElement('h4'); title.className='video-title'; title.textContent = v.title||'Untitled video';
    var desc = document.createElement('p'); desc.className='video-desc'; desc.textContent = v.desc||'';
    var actions = document.createElement('div'); actions.className='video-actions';
    var setBtn = document.createElement('button'); setBtn.textContent='Set Link'; setBtn.className='set-link';
    var editBtn = document.createElement('button'); editBtn.textContent='Edit';
    var delBtn = document.createElement('button'); delBtn.textContent='Remove';
    actions.appendChild(setBtn); actions.appendChild(editBtn); actions.appendChild(delBtn);
    info.appendChild(title); info.appendChild(desc); info.appendChild(actions);
    card.appendChild(thumb); card.appendChild(info);
    // click thumbnail -> open youtube
    card.addEventListener('click', function(e){ if(e.target.tagName==='BUTTON') return; if(v.id){ window.open('https://youtu.be/'+v.id,'_blank','noopener'); } });
    setBtn.addEventListener('click', function(){
      var url = prompt('Paste the YouTube video URL (https://youtu.be/ or https://www.youtube.com/watch?v=...)', v.url||'');
      if(!url) return;
      var id = parseYouTubeId(url);
      if(!id){ alert('Could not parse YouTube ID from that URL.'); return; }
      v.url = url; v.id = id; v.title = v.title || 'YouTube video';
      saveAll(); render();
    });
    editBtn.addEventListener('click', function(){ var t=prompt('Title', v.title||''); if(t!==null) v.title=t; var d=prompt('Description', v.desc||''); if(d!==null) v.desc=d; saveAll(); render(); });
    delBtn.addEventListener('click', function(){ if(confirm('Remove this video?')){ var arr = load(); arr.splice(i,1); save(arr); render(); }});
    return card;
  }
  function render(){
    var container = document.getElementById('videoList'); if(!container) return;
    var arr = load(); container.innerHTML=''; arr.forEach(function(v,i){ container.appendChild(createCard(v,i)); });
  }
  function saveAll(){ var items = window._videos || load(); save(items); }
  // add button
  document.addEventListener('DOMContentLoaded', function(){
    var add = document.getElementById('addVideoBtn');
    if(add){ add.addEventListener('click', function(){ var arr = load(); var v={url:'',id:null,title:'New video',desc:''}; arr.push(v); save(arr); render(); }); }
    // render on load
    render();
  });
})();
