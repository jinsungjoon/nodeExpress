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
		var paramId = req.body.id || req.query.id;
		var time = req.body.time || req.query.time;
		var memo = req.body.memo || req.query.memo;
			console.log("memo:"+memo);
			
			
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
		
		// 클라이언트에 응답 전송
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h3>파일 업로드 성공</h3>');
		res.write('<hr/>');
		res.write('<form method="post" action="/process/redirect">');
		res.write('<h1>등록성공</h1>');
		res.write('<div><p>작성자 : ' + paramId + '</p></div>');
		res.write('<div><p>작성일자 : ' + time + '</p></div>');
		res.write('<div><p>메모 : ' + memo + '</p></div>');
		res.write("<br><br><input type='submit' value='다시작성'> </form>");
		res.write('<p>원본 파일명 : ' + originalname + ' -> 저장 파일명 : ' + filename + '</p>');
		res.write('<p>MIME TYPE : ' + mimetype + '</p>');
		res.write('<p>파일 크기 : ' + size + '</p>');
		res.write('<img src="../uploads/'+filename+'">');
		res.end();
		
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
});

