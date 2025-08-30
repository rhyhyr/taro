import { Tmap } from '/api.js';
const appKey = Tmap; // Tmap API 키 입력

document.addEventListener('DOMContentLoaded', function () {
  const inputText = localStorage.getItem('userInputText');
  const inputDisplay = document.getElementById('inputDisplay');
  const $endResults = $('#endResults');

  if (!inputText || inputText.trim().length < 2) {
    inputDisplay.textContent = '입력된 텍스트가 없거나 너무 짧습니다.';
    return;
  }

  inputDisplay.textContent = `입력된 검색어: "${inputText}"`;

  $.get('https://apis.openapi.sk.com/tmap/pois', {
    version: 1,
    searchKeyword: inputText.trim(),
    areaLLCode : '26',
    areaLMCode: '000',
    resCoordType: 'WGS84GEO',
    reqCoordType: 'WGS84GEO',
    count: 20,
    appKey: appKey
  }).done(res => {
    const pois = res.searchPoiInfo?.pois?.poi || [];
    $endResults.empty();

    if (pois.length === 0) {
      $("<li>").text("검색 결과가 없습니다").appendTo($endResults);
      return;
    }

    pois.forEach(poi => {
      const $listItem = $("<li>");

      // 장소 이름 표시
      const $nameDiv = $("<div>").text(poi.name).addClass('result-name');
      $listItem.append($nameDiv);

      // 주소 표시 (fullAddressRoad)
      const $addressDiv = $("<div>").addClass('result-address');
      if (poi.newAddressList && poi.newAddressList.newAddress && poi.newAddressList.newAddress.length > 0) {
        $addressDiv.text(poi.newAddressList.newAddress[0].fullAddressRoad);
      } else {
        $addressDiv.text('주소 정보 없음'); // 주소 정보가 없을 경우
      }
      $listItem.append($addressDiv);

      $listItem.on("click", () => {
        const destX = poi.frontLon;
        const destY = poi.frontLat;

        // 다음 페이지로 좌표 전달
        window.location.href = `/path?x=${destX}&y=${destY}`;
      });

      $listItem.appendTo($endResults);
    });
  });
});
