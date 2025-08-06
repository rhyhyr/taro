// 각 섹션의 선택 상태를 저장하는 변수
let locationPermissionSelected = false;
let privacyAgreementSelected = false;

document.addEventListener('DOMContentLoaded', function() {

  // 개인정보 동의 버튼들
  const disagreeBtn = document.getElementById('disagreeBtn');
  const agreeBtn = document.getElementById('agreeBtn');

  // 비동의 버튼
  disagreeBtn.addEventListener('mousedown', function() {
    toggleButton('disagreeBtn');
  });

  disagreeBtn.addEventListener('touchstart', function(e) {
    e.preventDefault();
    toggleButton('disagreeBtn');
  });

  // 동의 버튼
  agreeBtn.addEventListener('mousedown', function() {
    toggleButton('agreeBtn');
  });

  agreeBtn.addEventListener('touchstart', function(e) {
    e.preventDefault();
    toggleButton('agreeBtn');
  });
});

// 버튼 클릭 시 스타일 변경 함수
function toggleButton(buttonId) {
  const button = document.getElementById(buttonId);

  // 버튼 스타일 토글
  if (button.classList.contains('btn-active')) {
    button.classList.remove('btn-active');
    // 상태 업데이트
    if (buttonId === 'allowBtn') {
      locationPermissionSelected = false;
    }
    else {
      privacyAgreementSelected = false;
    }
  }
  else {
    button.classList.add('btn-active');
    // 상태 업데이트
    if (buttonId === 'allowBtn') {
      locationPermissionSelected = true;
    }
    else {
      privacyAgreementSelected = true;
    }
  }

  // 개인정보 동의 섹션에서는 한 버튼만 활성화되도록 함
  if (buttonId === 'disagreeBtn' || buttonId === 'agreeBtn') {
    const otherButtonId = buttonId === 'disagreeBtn' ? 'agreeBtn' : 'disagreeBtn';
    const otherButton = document.getElementById(otherButtonId);
    // 다른 버튼이 활성화되어 있으면 비활성화
    if (otherButton.classList.contains('btn-active')) {
      otherButton.classList.remove('btn-active');
    }
  }

  // 두 섹션 모두 선택되었는지 확인하고 다음 페이지로 이동
  checkAndNavigate();
}

// 임시 좌표 받기
const coord = document.getElementById('coord');
const cdiv = document.getElementById('cdiv');
cdiv.style.display='none';
coord.addEventListener('click', function(){
  const sx = document.getElementById('x').value;
  const sy = document.getElementById('y').value;

  console.log(`x: ${sx}`);
  console.log(`y: ${sy}`);

  const coordinates = { x: sx, y: sy };
  // 다음 페이지로 넘어가기 위해 권한/동의 상태를 true로 설정
  locationPermissionSelected = true;
  privacyAgreementSelected = true;
  // 백엔드로 좌표를 비동기로 전송
      fetch("/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(coordinates)
      })
      .then(response => {
        if (response.ok) {
          // 전송 완료 후 speech 페이지로 이동
          window.location.href = "/speech";
        } else {
          alert("좌표 전송 실패");
        }
      })
      .catch(error => {
        console.error("에러 발생:", error);
        alert("네트워크 오류가 발생했습니다.");
      });
});


// 두 섹션 모두 선택되었는지 확인하고 다음 페이지로 이동하는 함수
function checkAndNavigate() {
	if (locationPermissionSelected && privacyAgreementSelected && startCoords?.x && startCoords?.y) {
		// 좌표를 백엔드에 비동기로 전송
		fetch("/list", {
		  method: "POST",
		  headers: {
		    "Content-Type": "application/json"
		  },
		  body: JSON.stringify(startCoords)
		})
		.then(response => {
		  if (response.ok) {
		    // 전송 완료 후 speech로 이동
		    window.location.href = "/speech";
		  } else {
		    alert("좌표 전송 실패");
		  }
		});
	}
}