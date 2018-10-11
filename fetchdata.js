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


function submit(name,caseId,projectId) {
  base('Đề xuất').create({
    "Người đề xuất": name,
    "Hạng mục chi": [
      caseId
    ],
    "Dự án": [
      projectId
    ]
  }, function(err, record) {
      if (err) { console.error(err); return; }
      console.log('post sucess',record.getId());
  });
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
      actionOnReady()
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
  Vue.config.devtools = true;

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
          //console.log("values",Object.keys(this.recordsAfterFilterProject) == [] );
        } 
      }
    }
  });

  var proposals = new Vue({
    el: "#proposals",
    data : {
      number : 1,
      data: Object.assign([])
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
        for(let i= 0; i < this.number; i++) {
        let _projectId =  this.data[i].projectId;
        let _caseId = this.data[i].caseId;
        if(_projectId == null || _caseId == null) {
          this.failMessage = 'Khong the Post';
          return;
        }
        submit('Quyên', _caseId, _projectId);
        }
      },

      callEvent: function(){
        console.log('run')
      }
    }
  });

}


