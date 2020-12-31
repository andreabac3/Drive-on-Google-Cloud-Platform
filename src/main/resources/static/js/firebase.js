// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'XXX',
  authDomain: 'drive-cloud-on-gcp.firebaseapp.com',
  databaseURL: 'https://drive-cloud-on-gcp.firebaseio.com',
  projectId: 'drive-cloud-on-gcp',
  storageBucket: 'drive-cloud-on-gcp.appspot.com',
  messagingSenderId: 'XXX',
  appId: '1:XXX',
};

// pages in which each user is allowed to enter
const redirect = true;
const redirect_url = '/manager';
const control_page_permissions = false;

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    refreshFirebaseToken(user);
    refreshUserInfo(user);
    checkTokenTimeout(user);
    // TODO Si assume che esistano solo sales e customers
  } else {
    if (control_page_permissions) {
      const pageName = get_url_filename(); // todo: get_url_filename da problemi a volte
      if (pageName !== '' && pageName !== 'password' && pageName !== 'logout' && pageName !== 'new-password' && pageName !== 'sales') {
        // / if (SEC_OPEN_PAGES.indexOf(pageName) === -1) {
        changeWindow('/');
      }
    }
  }
});

function refreshFirebaseToken(user) {
  // https://stackoverflow.com/questions/42616318/refresh-firebase-token
  user.getIdTokenResult(false).then(function(idTokenResult) {
    const now = new Date();
    const expiration = Date.parse(localStorage.getItem('token_expires_date'));
    if (now.getMilliseconds() >= expiration) {
      document.location.href = '/logout';
    }

    localStorage.setItem('session_token', idTokenResult.token);
    $.cookie('session_token', idTokenResult.token);
    localStorage.setItem('token_expires_date', idTokenResult.expirationTime);
  }).catch(function(error) {
    if (error) throw error;
  });
}

function refreshUserInfo(user) {
  localStorage.setItem('uid', user.uid);
  localStorage.setItem('user_email', user.email);
  $.cookie('uid', user.uid);
}

function checkTokenTimeout(user) {
  setTimeout(function() {
    refreshFirebaseToken(user);
    refreshUserInfo(user);
    checkTokenTimeout(user);
  }, 300000);
}

// Put it into login
function get_user_info(uid, token) {
  return fetch(BASE_URL + '/user/getInfo', {
    method: 'POST',
    body: JSON.stringify({
      // "idToken": token
      'uid': uid,
    }),
  }).then((response) => handleHttpErrors(response)).then((response) => response.json()).then((json) => {
    if (json['status'] === '1') {
      return false;
    }

    localStorage.setItem('user_type', json['user_type']);

    if (json['user_type'] === 'customers') {
      localStorage.setItem('provider_name', json['providerName']);
      localStorage.setItem('idBillingInfo', json['idBillingInfo']);
      localStorage.setItem('localOffice', json['localOffice']);
      localStorage.setItem('providerType', json['providerType']);
    } else {
      localStorage.setItem('provider_name', json['providerName'].split(','));
      localStorage.setItem('idBillingInfo', '');
      localStorage.setItem('sales_name', json['sales_name']);
    }

    return true;
  });
}

function tokenIdCallback(user, url) {
  if (user == null) {
    return;
  }

  user.getIdTokenResult(false).then((result) => {
    refreshUserInfo(user);
    localStorage.setItem('session_token', result.token);
    $.cookie('session_token', result.token);
    localStorage.setItem('token_expires_date', result.expirationTime);

    $.cookie('session_token', result.token);

    console.log('token_expires_date', localStorage.getItem('session_token'));
    if (redirect) {
      document.location.href = redirect_url;
    }
    // get_user_info(result.claims.user_id, result.token).then((ok) => {
    //   console.log(ok);
    //   if (ok) {
    //     if (redirect) {
    //       document.location.href = redirect_url;
    //     }
    //   } else {
    //     localStorage.clear();
    //     firebase.auth().signOut();
    //     loginButtonState(button, 'Login', false);
    //     alert('Incorrect username and/or password');
    //   }
    // });
  });
}

const button = document.getElementById('login-button');

function loginButtonState(button, text, disable = true) {
  button.disabled = disable;
  button.innerHTML = text;
}

function login(email, pass, redirectUrl) {
  const auth = firebase.auth();
  loginButtonState(button, 'Logging in', true);


  auth.signInWithEmailAndPassword(email, pass).then((result) => {
    tokenIdCallback(result.user, redirectUrl, true);
  }).catch(function(e1) {
    alert('Incorrect username and/or password');
    loginButtonState(button, 'Login', false);
  });
}

// / mode=resetPassword
// / oobCode=4W0foqghQl_RYYfxcPVGslroiPsnSdszxA0_Fda0oAYAAAFvt910cg
// / apiKey=AIzaSyDUW7u4cVLpYFrUfMM1ijOB8_eYzi3H02Q
// / lang=en
function getUrlParam(parameter, defaultvalue) {
  let urlparameter = defaultvalue;
  if (window.location.href.indexOf(parameter) > -1) {
    urlparameter = getUrlVars()[parameter];
  }
  return urlparameter;
}

// Form submit events

jQuery('#login_form').submit(function(e) {
  e.preventDefault();
  // alert("submitted");
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  login(email, password, '/campaigns');
  // / document.location.href = '/list_campaigns/list_campaigns.html';
});

jQuery('#reset-form').submit(function(e) {
  e.preventDefault();
  const password = document.getElementById('password').value;
  console.log('reset-password', password);
  const apiKey = getUrlParam('apiKey', null);
  if (apiKey !== firebaseConfig.apiKey) {
    alert('wrong apikey');
    return;
  }

  const oobCode = getUrlParam('oobCode', null);
  if (oobCode === null) {
    alert('wrong code');
    return;
  }

  firebase.auth().confirmPasswordReset(oobCode, password).then(() => {
    firebase.auth().signOut();
    document.location.href = '/';
  }).catch((error) => alert(error.message)).finally(firebase.auth().signOut());
});

jQuery('#request-form').submit(function(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  send_reset_password(email);
});

function send_reset_password(email) {
  firebase.auth().sendPasswordResetEmail(email).then((result) => {
    console.log(result);
  }).catch((error) => {
    console.log(error.message);
  }).finally(() => {
    document.location.href = '/reset/password/result';
  });
}
