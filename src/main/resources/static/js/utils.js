/* eslint no-unused-vars:0*/

const BASE_URL = '';
// const BASE_URL = "//10.0.0.22:8083";
// const BASE_URL = "//app-java-engine-11.appspot.com";

const IMAGE_EXTENSIONS = ['gif', 'jpeg', 'jpg', 'png'];
const EXCEL_EXTENSIONS = ['.xls', '.xlsx', '.pdf'];
const PDF_EXTENSIONS = ['.pdf'];

const NAIVE_LOCK = {
  history: false,
  fsHistory: false,
};

const SEC_OPEN_PAGES = [
  '',
  'profile',
  'login',
  'result',
  'new-password',
  'password',
  'manager',
  'preview_select',
  'preview',
  'campaigns',
  'logout',
  'sales',
  'preview_landing.html',
];

const SEC_ALLOWED_PAGES = {
  'sales': ['user', 'add'],
  'customers': ['new', 'products', 'banner', 'add_order_form'],
};

const testing = false;

async function request_companies_options() {
  const response = await fetch(BASE_URL + '/provider/findAll', {headers: getAuthHeader()});

  const json = await response.json();

  console.log('request_companies_options', json);

  return await json;
}

async function request_countries_options() {
  const response = await fetch(BASE_URL + '/json_test/countries.json', {headers: getAuthHeader()});

  const json = await response.json();

  return json.countries;
}

async function get_companies_composed_list(all = true, companies = undefined) {
  if (companies === undefined) {
    companies = await request_companies_options();
    console.log('get_companies_composed_list', companies);
    companies = companies.sort((a, b) => (a.name > b.name) ? 1 : -1);
  }

  console.log('get_countries_composed_list', companies);

  const result = [];
  if (all) result.push(`<option value="">All Companies</option>`);

  companies.forEach((item) => {
    result.push(`<option value="${item.name}">${item.name}</option>`);
  });

  return result;
}

async function get_countries_composed_list(all = true, countries = undefined) {
  if (countries === undefined) {
    countries = await request_countries_options();
  }

  const result = [];
  if (all) {
    result.push(`<option value="">All Countries</option>`);
    result.push(`<option value="WW">Worldwide</option>`);
  }

  countries.forEach((item) => {
    result.push(`<option value="${item.code}">${item.name}</option>`);
  });

  return result;
}

async function request_tech_info() {
  const response = await fetch(BASE_URL + '/techinfo/get', {
    method: 'GET',
    headers: getAuthHeader(),
  });
  // const response = await fetch(BASE_URL + '/json_test/techi_info.json');

  return await response.json();
}

function is_image(path) {
  const x = path.toLocaleLowerCase();

  if (chosen_category === 'Check' && chosen_product === 0) {
    return x.endsWith('.png');
  } else {
    for (let i = 0; i < IMAGE_EXTENSIONS.length; i++) {
      if (x.endsWith(IMAGE_EXTENSIONS[i])) {
        return true;
      }
    }
  }

  return false;
}

// https://www.quora.com/What-is-the-extension-of-Excel-files
function is_excel(path) {
  console.log(path);
  const x = path.toLocaleLowerCase();
  for (let i = 0; i < EXCEL_EXTENSIONS.length; i++) {
    if (x.endsWith(EXCEL_EXTENSIONS[i])) {
      return true;
    }
  }
  return false;
}

function is_pdf(path) {
  console.log(path);
  const x = path.toLocaleLowerCase();
  for (let i = 0; i < PDF_EXTENSIONS.length; i++) {
    if (x.endsWith(PDF_EXTENSIONS[i])) {
      return true;
    }
  }
  return false;
}

function get_filename(path) {
  return path.replace(/^.*[\\\/]/, '');
}

function get_url_filename() {
  return get_filename(window.location.href.split('?')[0]);
}

function check_permission() {
  const user_type = localStorage.getItem('user_type');
  // if (sec_allowed_pages[user_type].indexOf(get_url_filename()) === -1) {

  const page_name = get_url_filename();

  console.log('page', {p: page_name});
  console.log('user_type', user_type);
  console.log('openpages', SEC_OPEN_PAGES);
  console.log('is open', SEC_OPEN_PAGES.indexOf(page_name));

  // alert('pagename:', window.location.href.split('?'), page_name);

  // setTimeout(function(){
  if (SEC_OPEN_PAGES.indexOf(page_name) === -1) {
    console.log('non open page');
    if (user_type === null || SEC_ALLOWED_PAGES[user_type].indexOf(page_name) === -1) {
      console.log('permission denied');
      alert(page_name, user_type);
      // todo: do logout
      document.location.href = '/logout';
    }
  }

  console.log('permission granted', page_name);

  // se la pagina non è aperta
  /* if(SEC_OPEN_PAGES.indexOf(page_name) === -1) {
      if(user_type == null) {
        console.log('not open page: permission denied');
        document.location.href = '/';
      } else {
        console.log('user not null -.-');
        if (SEC_ALLOWED_PAGES[user_type].indexOf(page_name) === -1) {
          console.log('not allowed page: permission denied');
          document.location.href = '/';
        }
      }
    } */

  console.log('permission granted');
  // }, 1000);
}

function getUrlVars() {
  const vars = {};
  // const parts =
  window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
      function(m, key, value) {
        vars[key] = decodeURIComponent(value);
      });
  return vars;
}

const serialize_form = (form) => Array.from(new FormData(form).entries()).reduce((m, [key, value]) => Object.assign(m, {[key]: value}), {});

function generate_random_pw(length = 10) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function changeWindow(url) {
  document.location.href = url;
}

function getSessionToken() {
  const sessionToken = $.cookie('session_token');

  if (sessionToken === null) {
    alert('sessionToken is null');
    throw 'sessionToken is null';
  }
  return sessionToken;
}

function getAuthHeader() {
  return {'Content-Type': 'application/json; charset=utf-8', 'Authorization': getSessionToken()};
  // return {'Content-Type': 'application/json; charset=utf-8', 'Authorization': '45678'};
}

function getAuthHeaderNoContentType() {
  return {'Authorization': getSessionToken()};
}

function htmlToElement(html) {
  const template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

function setFooter() {
  if (get_url_filename() !== 'banner') {
    const footerTemplate = `
<div class="footer-section">
<!--    <div class="float-right" style="margin-top: 10px ;margin-right: 5%; color: white">-->
<!--        <a href="/cookie" target="_blank">-->
<!--            <button type="button" class="btn btn-outline-light">Cookie Notice</button>-->
<!--        </a>-->
<!--        <a href="/privacy" target="_blank">-->
<!--            <button type="button" class="btn btn-outline-light">Privacy Policy</button>-->
<!--        </a>-->
<!--    </div>-->
</div>`;

    const footer = htmlToElement(footerTemplate);

    document.body.appendChild(footer);
  }
}

function getBillingInfo(id) {
  console.log('get_billing_info', id);
  return fetch(BASE_URL + '/billingInfo/findById', {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({
      idBillingInfo: id,
    }),
  }).then((response) => handleHttpErrors(response)).then((response) => response.json());
}

function defaultBillingCacheObject() {
  return {'counter': 25};
}

function invalidateBillingInfoCache(id) {
  localStorage.setItem('billingInfoCompleteCache', JSON.stringify(setInitialBillingInfoCache(id)));
}

async function setInitialBillingInfoCache(id) {
  const val = defaultBillingCacheObject();

  const response = await getBillingInfo(id);
  val['value'] = await response.isComplete;

  localStorage.setItem('billingInfoCompleteCache', JSON.stringify(val));
  return val['value'];
}

async function isBillingInfoComplete(id) {
  let val = localStorage.getItem('billingInfoCompleteCache');

  if (val === null) return setInitialBillingInfoCache(id);

  val = JSON.parse(val);

  if (val['counter'] === 0) return setInitialBillingInfoCache(id);

  val['counter']--;
  localStorage.setItem('billingInfoCompleteCache', JSON.stringify(val));

  console.log('billingInfoCompleteCache', val);

  return val['value'];
}

async function getCompleteBadge() {
  let result = ``;

  if (get_url_filename() === '') return result;

  console.log('getBadge', localStorage.getItem('user_type') === 'customers'
      , localStorage.getItem('localOffice') !== 'HQ'
      , localStorage.getItem('providerType') !== 'Airline');

  // const isComplete = await isBillingInfoComplete(localStorage.getItem('idBillingInfo'));
  // console.log('isComplete', isComplete);
  if (localStorage.getItem('user_type') === 'customers') {
    if (!(localStorage.getItem('providerType') === 'Airline' && localStorage.getItem('localOffice') === 'HQ')) {
      const b = await isBillingInfoComplete(localStorage.getItem('idBillingInfo'));
      if (!b) {
        result = `
<!--<a href="#" data-toggle="tooltip" data-placement="top" title="Billing info are incomplete!">-->
<!--<span class="d-inline-block" tabindex="0" data-toggle="tooltip" title="Billing info are incomplete!">-->
    <span style="color: red;">
    <abbr title="Billing info are incomplete!" style="text-decoration: none; font-size: 20px; cursor: default;!important;">&#9888;</abbr>
    </span> 
<!--</span>   -->
<!--</a>-->`
        ;
      }
    }
  }

  return result;
}

async function setTopBar() {
  const header = document.getElementsByClassName('header-section')[0];

  const idBillingInfo = localStorage.getItem('idBillingInfo');
  let param = '';
  if (idBillingInfo !== '') {
    param = `&idBillingInfo=${idBillingInfo}`;
  }
  console.log('billing info', idBillingInfo);
  const completedBadge = await getCompleteBadge();
  console.log('start', completedBadge);

  if (header !== undefined) {
    console.log('setting header', header, header.innerHTML);
    header.innerHTML = `
<div style="height: 10%;">
    <div style="min-height: 75px;">
        <div class="logo float-left"> 
        <a href="/manager">
            <img width="150px"  src="/imgs/logo.png"/>     
        </a>
        </div> 
        <div class="logo float-right" style="margin-right: 5%; color: white">
              <a href="/logout">
                  ${completedBadge} <button type="button" class="btn btn-outline-light">Logout</button>
              </a>
          
         </div>
        
    </div>
</div>
`;
  }
}

function historyBack() {
  console.log(window.history);

  if (!NAIVE_LOCK.history) {
    NAIVE_LOCK.history = true;

    if (window.history.length) { // se c'è una cronologia
      window.history.back();
    }
  }
}

function setPageArrow() {
  const header = document.getElementsByClassName('back-page-arrow')[0];

  if (header !== undefined) {
    console.log('setting header', header, header.innerHTML);
    header.onclick = historyBack;
  }
}

function insertFavicon() {
  // const tag = '<link rel="shortcut icon" type="image/x-icon" href="images/favicon.ico"/>';

  const link = document.querySelector('link[rel*=\'icon\']') || document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'shortcut icon';
  link.href = '/imgs/logo.png';
  document.getElementsByTagName('head')[0].appendChild(link);
}

function _dynamicallyLoadScript(url) {
  const script = document.createElement('script'); // create a script DOM node
  script.src = url; // set its src to the provided URL
  script.type = 'text/javascript';
  script.async = false;
  document.head.appendChild(script); // add it to the end of the head section of the page (could change 'head' to 'body' to add it to the end of the body section instead)
}

function dynamicallyMultipleLoadScript(urls) {
  urls.forEach((url) => _dynamicallyLoadScript(url));
}

function handleNetworkErrors(response) {
  if (!response.ok) {
    throw new Error('Network Error');
  }

  return response;
}

async function handleHttpErrors(response) {
  if (!response.ok) {
    if (response.status === 418) {
      alert('Session Expired, please log in again');
      changeWindow('/logout');
      throw new Error('Error with token');
    }
  }

  return response;
}

async function handleAllErrors(response) {
  if (!response.ok) {
    if (response.status === 418) {
      alert('Session Expired, please log in again');
      throw new Error('Error with token');
    }
  }

  response = await response.json();

  handleErrors(response);

  return response;
}

function handleErrors(response) {
  console.log('handleErrors', response);
  // handleNetworkErrors(response);
  if (response.status) {
    if (response.status !== '0') {
      if (response.details === 'uid not found') {
        changeWindow('/logout');
        throw new Error('Error with token');
      }

      alert('Error: ' + response.details);
      throw new Error('Error: ' + response.details);
    }
  }

  return response;
}

function startPage() {
  const firebaseDefaultJs = [
    'https://www.gstatic.com/firebasejs/7.6.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/7.6.1/firebase-auth.js',
    // / 'https://www.gstatic.com/firebasejs/7.6.1/firebase-analytics.js',
  ];

  check_permission();

  const myFiles = ['/js/firebase.js'];

  dynamicallyMultipleLoadScript(firebaseDefaultJs);
  dynamicallyMultipleLoadScript(myFiles);

  if (getUrlVars()['cr'] === 'user' || get_url_filename() === 'sales') {
    dynamicallyMultipleLoadScript(['/js/create_user.js']);
  }

  setTopBar();
  setFooter();
  insertFavicon();

  setPageArrow();

  if (get_url_filename() === '') {
    console.log('token_expires_date', localStorage.getItem('token_expires_date'));
    const now = new Date();
    const expiration = Date.parse(localStorage.getItem('token_expires_date'));
    if (Date.parse(now.toUTCString()) < (expiration - 60 * 1000)) {
      if (localStorage.getItem('user_type') != null) {
        document.location.href = '/campaigns';
      }
    }
  }
}

startPage();

