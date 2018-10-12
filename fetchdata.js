'use strict';

const APIKEY = 'keyKfVuiM6CHUTRrF';
var Airtable = require('airtable');
var base  = new Airtable({
  apiKey:APIKEY
}).base(
  'appTIRFofu4KqVvJY'
)
var casesAll = [];
var projectsAll = [];
var accountsAll = [];
var loginUrl = 'https://wt-986822ae0ddf95aaa96a831043dc5c1e-0.sandbox.auth0-extend.com/restApi/login';
var addUserUrl = 'https://wt-986822ae0ddf95aaa96a831043dc5c1e-0.sandbox.auth0-extend.com/restApi/add-user'
var nameProposaler = undefined;





function submit(name,caseId,projectId,Ins) {
  base('Đề xuất').create({
    "Người đề xuất": name,
    "Hạng mục chi": [
      caseId
    ],
    "Dự án": [
      projectId
    ]
  }, function(err, record) {
      if (err || typeof record === 'undefined') { 
        //console.error(err);
        Ins.failed();
      } else {
        Ins.sucessed();
      }
  });
}

function postData(url = ``, data = {}) {
  // Default options are marked with *
    return fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, cors, *same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, same-origin, *omit
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            // "Content-Type": "application/x-www-form-urlencoded",
        },
        redirect: "follow", // manual, *follow, error
        referrer: "no-referrer", // no-referrer, *client
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
    .then(response => response); // parses response to JSON
}

listAccount()
function listAccount() {
  base('Tài Khoản').select({
    view : "Full",
    cellFormat : "json"

  }).eachPage(function page(records, fetchNextPage) {
    records.forEach(record => {
      //console.log(record.get('Tài khoản'));
      accountsAll.push(record);
    });
    fetchNextPage();
  }, function done(err) {
    if (err) { console.error(err); return; }
    listProjects()
});
}


function listProjects() {
  base('Dự án').select({
    view: "Grid view",
    cellFormat : 'json'
}).eachPage(function page(records, fetchNextPage) {
    // This function (`page`) will get called for each page of records.

    records.forEach(function(record) {
        //console.log('name', record.get('Name'));
        projectsAll.push(record)
    });

    // To fetch the next page of records, call `fetchNextPage`.
    // If there are more records, `page` will get called again.
    // If there are no more records, `done` will get called.
    fetchNextPage();

}, function done(err) {
    if (err) { console.error(err); return; }
    listCases()
});
}


function listCases(projectName) {
  base('Sổ cái').select({
    // Selecting the first 3 records in 00_Total:
    view: "00_Total",
    cellFormat: "json"
  }).eachPage(function page(records, fetchNextPage) {
      // This function (`page`) will get called for each page of records.

      records.forEach(function(record) {
          //console.log('Retrieved', record.get('Info'));
          casesAll.push(record)
      });

      // To fetch the next page of records, call `fetchNextPage`.
      // If there are more records, `page` will get called again.
      // If there are no more records, `done` will get called.
      fetchNextPage();

  }, function done(err) {
      if (err) { console.error(err); return; };
      actionOnReady();
  });

}

function getAtrribute(data,attr) {
  let _return = data.map(
    record => record.get(attr)
  )
  return _return.filter(record => typeof record !== 'undefined')
}

function buildHtml(data,property) {
  return data.map(record => {
    // return `<option value=${record.id}>${record.get(property)}</option>`
    return {
      id : record.id,
      text: record.get(property)
    }
  })
}

  function buildFilterObject(recordsOfledger) {
  let rs = Object.assign([]);
  rs['noSuplier'] = [];
  recordsOfledger.map(record => {
    let _sendTo = record.get('Nộp vào');
    if (typeof _sendTo !== 'undefined') {
      _sendTo  = _sendTo.length < 2 ? _sendTo.toString() : false;
      if(_sendTo === false ) {console.log('Nap vao nhieu hon 1 tai khoan')}
      let _suplier = getSuplierByid(_sendTo)
      if (Object.keys(rs).indexOf(_suplier) > -1) {       
        rs[_suplier].push(record);
      } else {
        rs[_suplier] = [record];
      }
    } else {
      rs['noSuplier'].push(record)
    }
  })
  return rs;
}

function getSuplierByid(id) {
  if (typeof id !== 'undefined') {
    // if (id.length > 1) {console.log('Nop vao 2 tai khoan')}
    let _id = id.toString();
    let _rs = accountsAll.filter(record => record.id == _id);
    return _rs[0].get('Tài khoản');
  } else {
    return 'Không Có Nhà Cung Cấp'
  }
}

function matchingLedger(idOfProject) {
  let _lstInfo = [];
  casesAll.forEach(record => {
    let _projects = record.get('Dự án');
    if(_projects.indexOf(idOfProject) >=0) {
      _lstInfo.push(record)
    }
  });
  return _lstInfo;
}


function actionOnReady() {
  // let namesOfProject = getAtrribute(projectsAll,'Name');
  // let infoOfLedger = getAtrribute(casesAll,'Info');
  //console.log(buildSelectHtml(projectsAll,'Name'));

  Vue.component('login-form', {
    data: function() {
      return {
        loading: false,
        loginFailed: false,
        username: '',
        password: '',
        addUser : false,
        pwdAdmin: '',
        btnText: 'Đăng Nhập'
      }
    },
    methods : {
      submit: function() {
        this.loading= true;
        let username = this.username;
        let password = this.password;
        if (this.addUser === true) {
          let pwdAdmin = this.pwdAdmin
          if (username == '' || password == '' || pwdAdmin == '') {this.loading= false; this.loginFailed= true; return;}
          let dataToPost  = {"name": username, "password": password, "pwdAdmin": pwdAdmin};
          postData(addUserUrl,dataToPost)
            .then(data => {
              this.loading = false;
              if ( data.status == 500) {
                this.loginFailed = true;
              } else {
                if (data.status ==200){
                  this.addUser = false;
                  this.submit();
                }
              }
            }) // JSON-string from `response.json()` call
            .catch(error => console.error(error));
        } else {
          if (username == '' || password == '') { this.loading= false; this.loginFailed= true; return;}
          let dataToPost  = {"name": username, "password": password};
          postData(loginUrl,dataToPost)
            .then(data => {
              this.loading = false;
              if ( data.status == 500) {
                this.loginFailed = true;
              } else {
                let _name = data.json();
                _name.then(
                  data => this.$emit('login-sucess', data.name)
                );
                
              }
            }) // JSON-string from `response.json()` call
            .catch(error => console.error(error));
        }
        
      }
    },
    template: `
      <div class="modal" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Đăng Nhập</h5>
          </div>
          <div class="modal-body">
            <div class="input-group mb-3">
              <input type="text" class="form-control" placeholder="Username" v-model = "username" aria-label="Username" aria-describedby="basic-addon1">
            </div>
            <div class="input-group mb-3">
              <input type="password" class="form-control" placeholder="Password" v-model = "password" aria-label="Password" aria-describedby="basic-addon1">
            </div>
            <div class="input-group mb-3" v-if= "addUser">
              <input type="password" class="form-control" placeholder="Password of admin to add user" v-model = "pwdAdmin" aria-label="Password" aria-describedby="basic-addon1">
            </div>
            <div v-if="loading" style="text-align: center"><img src= './loading.gif' style="width:20%"/></div>
            <p class= "text-danger" v-if="loginFailed">Thông tin không chính xác, Vui lòng kiểm tra lại thông tin.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-warning" v-on:click="submit">Submit</button>
            <button type="button" class="btn btn-warning" v-on:click="addUser= !addUser">Thêm User</button>
          </div>
        </div>
      </div>
    </div>
    `
  });

  Vue.component('result',{
    props: ['caption','sucess','failed'], // type css : alert alert-primary or alert dangerous, stt = true || false
    template: `
    <div class="modal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Đề Xuất</h5>
        </div>
        <div class="modal-body">
          <p class="alert" v-bind:class = "{'alert-primary':sucess,'alert-danger':failed}">{{caption}}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-warning" v-on:click="$emit('close-modal')">Trở Về</button>
        </div>
      </div>
    </div>
  </div>
    `
  })

  var  proposaler = new Vue({
    el : "#proposaler",
    data : {
      name: undefined,
      displayLoginForm : true,
    },
    methods : {
      loginSucess: function(name) {
        this.displayLoginForm = false;
        this.name = name;
        nameProposaler = name;
      }
    }
  })

  Vue.component('proposal',{
    props:['title'],
    template: '#proposal',
    data: () => { 
      return {
        number: typeof proposals === 'undefined' ? 1 : proposals.number, 
        failMessage: '',
        htmlProject : buildHtml(projectsAll,'Name'),
        htmlSuplier : null,
        htmlCase : null,
        recordsAfterFilterProject: null,
        selectedCase : {
          id: null,
          text: null
        },

        selectedSuplier: {
          id: null,
          text: null,
        },

        selectedProject : {
          id: null,
          text: null,
        }
      }
    },
    methods: {

      decreaseProposal: function () {
        if (proposals.number ==1) return;
        proposals.number -= 1;
      },

      selectCase: function() {
        let _event = {id : this.number, projectId : this.selectedProject.id, caseId: this.selectedCase.id};
        this.$emit('pass-data-to-parent',_event);
      },

      selectSuplier: function() {
        // console.log(this.selectedSuplier.text);
        let _selectedSuplier = this.selectedSuplier.text;
        // console.log(this.recordsAfterFilterProject);
        let _listRecord = this.recordsAfterFilterProject[_selectedSuplier] || this.recordsAfterFilterProject['noSuplier'] ;
        // console.log(_listRecord.length)
        // console.log('records',this.recordsAfterFilterProject['ACB-Ván sàn Vinyl Triết'])
        this.htmlCase = buildHtml(_listRecord,'Info');
      },

      selectProject : function() {
        //console.log('runON')
        let _seletedProjectId = this.selectedProject.id
        let lstLedgerRecord = matchingLedger(_seletedProjectId);
        this.recordAfterFilterProject = lstLedgerRecord;
        //console.log(lstLedgerRecord);
        if (lstLedgerRecord != []) {
          // select all record that it's "dự án" have project id
          this.recordsAfterFilterProject =  Object.assign([],buildFilterObject(lstLedgerRecord)) // [suplier1:[record1,record2]]
          // console.log('recors',this.recordAfterFilterProject)
          let _keys = Object.keys(this.recordsAfterFilterProject);
          this.htmlSuplier = _keys.length !== 0 ? _keys : ['Khong Co Nha Cung'];
          //console.log(this.htmlSuplier);
          //console.log("values",Object.keys(this.recordsAfterFilterProject) == [] );
        } 
      }
    }
  });



  var proposals = new Vue({
    el: "#proposals",
    data : {
      number : 1,
      data: Object.assign([]),
      resultSubmit: '',
      status: false,
      caption: '',
      sucess : false,
      error : false,

    },
    methods: {
      addNumber: function() {
        this.number +=1
      },
      
      addData: function(dataPassed) {
        console.log('run')
        let dataToAdd = {projectId:dataPassed.projectId, caseId : dataPassed.caseId};
        this.data[--dataPassed.id] = dataToAdd;
      },

      submitToAirtable(){
        document.getElementById("loading").style.display = "block";
        let _data = [];
        try {
          for(let i= 0; i < this.number; i++) {
            let _projectId =  this.data[i].projectId;
            let _caseId = this.data[i].caseId;
            if(_projectId == null || _caseId == null) {
              this.failed();
              break;
            }
            _data[i] = {projectId:_projectId, caseId : _caseId};
            }
        } catch (error) {
          this.failed();
          return;
        }
        _data.map(record => submit(nameProposaler, record.caseId, record.projectId,this))
      },

      failed: function(){
        document.getElementById("loading").style.display = "none";
        this.error= true;
        this.sucess = false;
        this.caption = 'Gửi Không Thành Công! Hãy Xem lại thông tin!';
        this.status= true
      },

      sucessed: function(){
        document.getElementById("loading").style.display = "none";
        this.caption = 'Gửi Thành Công';
        this.sucess = true;
        this.error = false;
        this.status = true;
      }
    }
  });
  Vue.config.devtools = true;
}


