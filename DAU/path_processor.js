// path_processor.js
// 경로 데이터 처리 및 실시간 정보 연동 기능을 담당합니다.

import { ODsay_ip, Busan } from './app_config_state.js'; // API 키 가져오기 (app_config_state에서 re-export된 것을 사용)

/**
 * XML 요소에서 특정 태그의 텍스트 콘텐츠를 가져옵니다.
 * 이 함수는 부산 버스 API 응답(XML) 파싱에 사용됩니다.
 * @param {Element} parent - 부모 XML 요소
 * @param {string} tagName - 가져올 태그 이름
 * @returns {string} - 태그의 텍스트 콘텐츠 또는 '정보 없음'
 */
function getText(parent, tagName) {
  const el = parent.getElementsByTagName(tagName)[0];
  return el ? el.textContent : "정보 없음";
}

/**
 * 부산 버스 도착 정보를 조회하여 가장 빠른 도착 시간과 버스 타입을 반환합니다.
 * @param {string} stationId - 정류장 ID
 * @param {string} busNo - 버스 번호
 * @returns {Promise<object|null>} - {min1: 도착까지 남은 분, busType: 버스 타입} 또는 null
 */
export async function getMinArrivalTime(stationId, busNo) {
  const url = `https://apis.data.go.kr/6260000/BusanBIMS/stopArrByBstopid?bstopid=${stationId}&serviceKey=${Busan}`;
  try {
    const res = await fetch(url);
    const xmlStr = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlStr, "application/xml");
    const items = [...xml.getElementsByTagName("item")];
    const match = items.find(item => getText(item, "lineno") === busNo);
    
    if (!match) return null; 

    const min1 = parseInt(getText(match, "min1"));
    const busType = getText(match, "bustype"); 
    console.log(`버스 번호:${getText(match, "lineno")}, 도착시간:${min1}`);
    
    return isNaN(min1) ? null : { min1: min1, busType: busType }; 
  } catch (error) {
    console.error("버스 도착 정보 조회 오류:", error);
    return null;
  }
}

/**
 * 출발지-목적지 간 대중교통 경로를 검색하고, 실시간 버스 도착 정보를 통합하여 경로를 평가합니다.
 * @param {number} startx - 출발지 X 좌표
 * @param {number} starty - 출발지 Y 좌표
 * @param {number} endx - 목적지 X 좌표
 * @param {number} endy - 목적지 Y 좌표
 * @returns {Promise<object|null>} - 처리된 경로 데이터 (최적/추천 경로) 또는 null
 */
export async function fetchAndScorePaths(startx, starty, endx, endy) {
  const url = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${startx}&SY=${starty}&EX=${endx}&EY=${endy}&SearchPathType=2&apiKey=${ODsay_ip}`;
  
  const res = await fetch(url);
  const data = await res.json();
  console.log("ODsay API 응답:", data);

  const paths = data.result?.path?.slice(0, 6); // ODsay에서 받은 경로 중 최대 4개 경로를 가져옵니다.
  if (!paths || paths.length === 0) {
    return null;
  }
  
  const busArrivalCache = new Map(); // 버스 도착 정보 캐시

  const scoredPaths = await Promise.all(paths.map(async (path) => {
    let walkTime = 0, transfers = path.info.busTransitCount, minArrival = Infinity;
    let isValid = true;
    let subPathsWithBusType = [];
    // '같은 정류장 이용' 조건 확인 변수
    let isSameStartStop = path.subPath.length > 0 && path.subPath[0].trafficType === 3 && path.subPath[0].distance <= 3;

    for (const sub of path.subPath) {
      if (sub.trafficType === 3) { // 도보 구간
        walkTime += sub.sectionTime;
        subPathsWithBusType.push(sub); 
      } else if (sub.trafficType === 2) { // 버스 구간
        const busNo = sub.lane[0].busNo;
        const stationId = sub.startLocalStationID;
        const cacheKey = `${stationId}_${busNo}`;
        let arrivalData; 

        if (busArrivalCache.has(cacheKey)) {
          arrivalData = busArrivalCache.get(cacheKey);
        } else {
          arrivalData = await getMinArrivalTime(stationId, busNo); // 부산 버스 API 호출
          busArrivalCache.set(cacheKey, arrivalData);
        }

        if (arrivalData === null || arrivalData.min1 === null) {
          isValid = false;
          break; 
        }
        
        subPathsWithBusType.push({ ...sub, busType: arrivalData.busType, min1: arrivalData.min1 }); 

        if (arrivalData.min1 < minArrival) minArrival = arrivalData.min1;
      }
    }
    return {
      path: { ...path, subPath: subPathsWithBusType }, 
      walkTime, transfers, minArrival, totalTime: path.info.totalTime, isValid, isSameStartStop
    };
  }));

  const validPaths = scoredPaths.filter(p => p.isValid);
  if (validPaths.length === 0) {
    return null; // 유효한 경로 없음
  }

  // 최적 경로(1.같은 정류장, 2.환승 횟수, 3.버스 도착 시간 순)를 선택
  const best = validPaths.sort((a, b) => {
	    // 1. 같은 정류장 이용 우선 (isSameStartStop이 true인 경로를 최우선으로)
        if (a.isSameStartStop !== b.isSameStartStop) {
            return b.isSameStartStop - a.isSameStartStop; // boolean을 숫자로 변환하여 true가 앞으로 오도록 정렬
        }
        // 2. 환승 횟수가 적은 순
	    if (a.transfers !== b.transfers) return a.transfers - b.transfers;
	    // 3. 버스 도착 시간이 빠른 순
	    return a.minArrival - b.minArrival;
  })[0];

  // 가장 빠른 경로를 선택
  const fastest = validPaths.reduce((a, b) => a.totalTime < b.totalTime ? a : b, validPaths[0]);
  
  return { bestPath: best, fastestPath: fastest };
}

/**
 * 주어진 경로에서 불필요한 도보 구간을 필터링하여 사용할 수 있는 경로 단계들을 반환합니다.
 * @param {object} path - 필터링할 경로 객체
 * @returns {Array} - 필터링된 경로 단계 배열
 */
export function filterAndPrepareRouteSteps(path) {
    let filteredSubPaths = [...path.subPath];

    // 1. 마지막 도보 구간이 있다면 제거
    if (filteredSubPaths.length > 0 && filteredSubPaths[filteredSubPaths.length - 1].trafficType === 3) {
      filteredSubPaths.pop();
    }

    // 2. 거리가 3m 이하인 도보 구간 제거 (너무 짧은 도보는 무시)
    filteredSubPaths = filteredSubPaths.filter(sub =>
      !(sub.trafficType === 3 && sub.distance <= 3)
    );
    return filteredSubPaths;
}