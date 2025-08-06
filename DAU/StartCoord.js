// 시작 위치정보 변수
let startCoords;

// 모든 버튼에 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', function() {
  // 위치 권한 버튼
  const allowBtn = document.getElementById('allowBtn');

  // mousedown 이벤트 (데스크톱)
  allowBtn.addEventListener('mousedown', function() {
    toggleButton('allowBtn');        
    
    navigator.geolocation?.getCurrentPosition(
	  pos => {
	    startCoords = {
	      x: pos.coords.longitude,
	      y: pos.coords.latitude
	    };
	    console.log('현재 위치:', startCoords);
	  },
	  err => {
	    console.error('위치 정보를 가져올 수 없습니다.', err);
	    alert('위치 정보를 가져올 수 없습니다.');
	  },
	  {
	    enableHighAccuracy: true,  // 🔥 고정밀 GPS 사용
	    timeout: 10000,            // 최대 대기 시간 (ms)
	    maximumAge: 0              // 캐시된 위치 정보 사용 안 함
	  }
	);
  });
  
  // touchstart 이벤트 (모바일)
  allowBtn.addEventListener('touchstart', function(e) {
    e.preventDefault(); // 기본 터치 동작 방지
    toggleButton('allowBtn');
    
 	// 현재 위치 설정
    navigator.geolocation?.getCurrentPosition(
      pos => {
        startCoords = {
          x: pos.coords.longitude,
          y: pos.coords.latitude
        };
        console.log('현재 위치:', startCoords);
      },
      err => {
	    console.error('위치 정보를 가져올 수 없습니다.', err);
	    alert('위치 정보를 가져올 수 없습니다.');
	  },
	  {
	    enableHighAccuracy: true,  // 🔥 고정밀 GPS 사용
	    timeout: 10000,            // 최대 대기 시간 (ms)
	    maximumAge: 0              // 캐시된 위치 정보 사용 안 함
	  }
    );
  });
});
