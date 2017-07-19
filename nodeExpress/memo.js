/**
 * session 사용하기
 * 
 * 웹브라우저에서 아래 주소의 페이지를 열고 웹페이지에서 요청
 *    http://localhost:3000/public/login2.html
 *
 * @date 2016-10-25
 * @author Mike
 */


  
// Express 기본 모듈 불러오기
var express = require('express')
  , http = require('http')
  , path = require('path');

// Express의 미들웨어 불러오기
var bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , static = require('serve-static')
  , errorHandler = require('errorhandler');

// 에러 핸들러 모듈 사용
var expressErrorHandler = require('express-error-handler');

// Session 미들웨어 불러오기
var expressSession = require('express-session');
var multer = require('multer');
var fs = require('fs');
var cors = require('cors');
// 익스프레스 객체 생성
var app = express();

// 기본 속성 설정
app.set('port', process.env.PORT || 3000);

// body-parser를 이용해 application/x-www-form-urlencoded 파싱
app.use(bodyParser.urlencoded({ extended: false }))

// body-parser를 이용해 application/json 파싱
app.use(bodyParser.json())

app.use('/public', static(path.join(__dirname, 'public')));


app.use('/uploads', static(path.join(__dirname, 'uploads')));
//클라이언트에서 ajax로 요청 시 CORS(다중 서버 접속) 지원
app.use(cors());
//mongoose 모듈 사용
var mongoose = require('mongoose');
//===== 데이터베이스 연결 =====//

//데이터베이스 객체를 위한 변수 선언
var database;

//데이터베이스 스키마 객체를 위한 변수 선언
var UserSchema;

//데이터베이스 모델 객체를 위한 변수 선언
var UserModel;

//데이터베이스에 연결
function connectDB() {
	// 데이터베이스 연결 정보
	var databaseUrl = 'mongodb://localhost:27017/local';
	 
	// 데이터베이스 연결
 console.log('데이터베이스 연결을 시도합니다.');
 mongoose.Promise = global.Promise;  // mongoose의 Promise 객체는 global의 Promise 객체 사용하도록 함
	mongoose.connect(databaseUrl);
	database = mongoose.connection;
	
	database.on('error', console.error.bind(console, 'mongoose connection error.'));	
	database.on('open', function () {
		console.log('데이터베이스에 연결되었습니다. : ' + databaseUrl);
		

		// 스키마 정의
		UserSchema = mongoose.Schema({
//			id: String,
//			name: String,
//			password: String
			id:  {type:String,required: true,unique: true},
			name:{type:String,required: true},
			password  :{type:String,required: true}
		});
		console.log('UserSchema 정의함.');
		
		// UserModel 모델 정의
		UserModel = mongoose.model("users", UserSchema);
		console.log('UserModel 정의함.');
		
	});
 
 // 연결 끊어졌을 때 5초 후 재연결
	database.on('disconnected', function() {
     console.log('연결이 끊어졌습니다. 5초 후 재연결합니다.');
     setInterval(connectDB, 5000);
 });
}

//multer 미들웨어 사용 : 미들웨어 사용 순서 중요  body-parser -> multer -> router
//파일 제한 : 10개, 1G
var storage = multer.diskStorage({
  destination: function (req, file, callback) {
      callback(null, 'uploads')
  },
  filename: function (req, file, callback) {
//      callback(null, file.originalname + Date.now())
      callback(null, Date.now() + file.originalname )
  }
});

var upload = multer({ 
  storage: storage,
  limits: {
		files: 10,
		fileSize: 1024 * 1024 * 1024
	}
});

// 라우터 사용하여 라우팅 함수 등록
var router = express.Router();
router.route('/process/memo').post(upload.array('photo', 1), function(req, res) {
	console.log('/process/photo 호출됨.');
	
	try {
		var files = req.files;
//		var paramId = req.body.id || req.query.id;
//		var time = req.body.time || req.query.time;
//		var memo = req.body.memo || req.query.memo;
//			console.log("memo:"+memo);
		  var paramId = req.body.id || req.query.id;
	    var paramPassword = req.body.password || req.query.password;
	    var paramName = req.body.name || req.query.name;	
			
        console.dir('#===== 업로드된 첫번째 파일 정보 =====#')
        console.dir(req.files[0]);
        console.dir('#=====#')
        
		// 현재의 파일 정보를 저장할 변수 선언
		var originalname = '',
			filename = '',
			mimetype = '',
			size = 0;
		
		if (Array.isArray(files)) {   // 배열에 들어가 있는 경우 (설정에서 1개의 파일도 배열에 넣게 했음)
	        console.log("배열에 들어있는 파일 갯수 : %d", files.length);
	        
	        for (var index = 0; index < files.length; index++) {
	        	originalname = files[index].originalname;
	        	filename = files[index].filename;
	        	mimetype = files[index].mimetype;
	        	size = files[index].size;
	        }
	        
	    } else {   // 배열에 들어가 있지 않은 경우 (현재 설정에서는 해당 없음)
	        console.log("파일 갯수 : 1 ");
	        
	    	originalname = files[index].originalname;
	    	filename = files[index].name;
	    	mimetype = files[index].mimetype;
	    	size = files[index].size;
	    }
		
		console.log('현재 파일 정보 : ' + originalname + ', ' + filename + ', '
				+ mimetype + ', ' + size);
		if (database) {
			addUser(database, paramId, paramPassword, paramName, function(err, addedUser) {
					if (err) {throw err;}
				
	            // 조회된 레코드가 있으면 성공 응답 전송
				if (addedUser) {

	                // 조회 결과에서 사용자 이름 확인
//					var username = docs[0].name;
					
					// 클라이언트에 응답 전송
					res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
					res.write('<h3>파일 업로드 성공</h3>');
					res.write('<hr/>');
					res.write('<form method="post" action="/process/redirect">');
					res.write('<h1>등록성공</h1>');
					res.write('<div><p>사용자 아이디 : ' + paramId + '</p></div>');
					res.write('<div><p>사용자 이름 : ' + paramName + '</p></div>');
					res.write("<br><br><a href='/public/login.html'>다시 로그인하기</a>");
					res.write("<br><br><input type='submit' value='다시작성'> </form>");
					res.write('<p>원본 파일명 : ' + originalname + ' -> 저장 파일명 : ' + filename + '</p>');
					res.write('<p>MIME TYPE : ' + mimetype + '</p>');
					res.write('<p>파일 크기 : ' + size + '</p>');
					res.write('<img src="../uploads/'+filename+'">');
					res.end();
				
				} else {  // 조회된 레코드가 없는 경우 실패 응답 전송
					res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
					res.write('<h1>로그인  실패</h1>');
					res.write('<div><p>아이디와 패스워드를 다시 확인하십시오.</p></div>');
					res.write("<br><br><a href='/public/login.html'>다시 로그인하기</a>");
					res.end();
				}
			});
		}else{
			res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
			res.write('<h2>데이터베이스 연결 실패</h2>');
			res.write('<div><p>데이터베이스에 연결하지 못했습니다.</p></div>');
			res.end();
		}
		
		
	} catch(err) {
		console.dir(err.stack);
	}	
		
});
// 로그인 라우팅 함수 - 로그인 후 세션 저장함
router.route('/process/memo2').post(function(req, res) {
	console.log('/process/memo 호출됨.');
	console.dir(req);
	var paramId = req.body.id || req.query.id;
	var time = req.body.time || req.query.time;
	var memo = req.body.memo || req.query.memo;
		console.log("memo:"+memo);
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		
		res.write('<form method="post" action="/process/redirect">');
		res.write('<h1>등록성공</h1>');
		res.write('<div><p>작성자 : ' + paramId + '</p></div>');
		res.write('<div><p>작성일자 : ' + time + '</p></div>');
		res.write('<div><p>메모 : ' + memo + '</p></div>');
		res.write("<br><br><input type='submit' value='다시작성'> </form>");
		res.end();
});

// 로그아웃 라우팅 함수 - 로그아웃 후 세션 삭제함
router.route('/process/redirect').post(function(req, res) {
	console.log('/process/redirect 호출됨.');
	res.redirect('/public/memo.html');
});


app.use('/', router);


//사용자를 인증하는 함수
var authUser = function(database, id, password, callback) {
	console.log('authUser 호출됨 : ' + id + ', ' + password);
	
 // 아이디와 비밀번호를 이용해 검색
	UserModel.find({"id":id, "password":password}, function(err, results) {
		if (err) {  // 에러 발생 시 콜백 함수를 호출하면서 에러 객체 전달
			callback(err, null);
			return;
		}
		
		console.log('아이디 [%s], 패스워드 [%s]로 사용자 검색결과', id, password);
		console.dir(results);
		
	    if (results.length > 0) {  // 조회한 레코드가 있는 경우 콜백 함수를 호출하면서 조회 결과 전달
	    	console.log('아이디 [%s], 패스워드 [%s] 가 일치하는 사용자 찾음.', id, password);
	    	callback(null, results);
	    } else {  // 조회한 레코드가 없는 경우 콜백 함수를 호출하면서 null, null 전달
	    	console.log("일치하는 사용자를 찾지 못함.");
	    	callback(null, null);
	    }
	});
};


//사용자를 추가하는 함수
var addUser = function(database, id, password, name, callback) {
	console.log('addUser 호출됨 : ' + id + ', ' + password + ', ' + name);
	
	// UserModel 인스턴스 생성
	var user = new UserModel({"id":id, "password":password, "name":name});

	// save()로 저장 : 저장 성공 시 addedUser 객체가 파라미터로 전달됨
	user.save(function(err, addedUser) {
		if (err) {
			callback(err, null);
			return;
		}
		
	    console.log("사용자 데이터 추가함.");
	    callback(null, addedUser);
	     
	});
};



// 404 에러 페이지 처리
var errorHandler = expressErrorHandler({
    static: {
      '404': './public/404.html'
    }
});

app.use( expressErrorHandler.httpError(404) );
app.use( errorHandler );


// Express 서버 시작
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
  
//데이터베이스 연결을 위한 함수 호출
  connectDB();
});

