package com.web.taro;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.*;
import java.net.URI;
import java.security.cert.X509Certificate;

@RestController
public class BusApiController {

    private static final Logger logger = LoggerFactory.getLogger(BusApiController.class);

    // ▼▼▼ 여기에 ODsay 콘솔에서 발급받은 '서버용' API 키를 입력하세요. ▼▼▼
    private final String odsayApiKey = "sKjjRgwggOCqUOMBz6omJ9L0diWbh0WucBzr/O45OU0";

    @GetMapping("/api/station")
    public ResponseEntity<String> getNearestStation(@RequestParam("x") double x, @RequestParam("y") double y) {
        logger.info("정류장 정보 요청 수신: x={}, y={}", x, y);

        try {
            disableSslVerification();

            // 원래의 ODsay API를 호출하는 코드로 복원합니다.
            String urlString = "https://api.odsay.com/v1/api/pointSearch" +
                               "?lang=0" +
                               "&x=" + x +
                               "&y=" + y +
                               "&radius=3" +
                               "&stationClass=1" +
                               "&apiKey=" + odsayApiKey; // 서버용 키

            logger.info("생성된 ODsay API 요청 URI: {}", urlString);

            RestTemplate restTemplate = new RestTemplate();
            URI uri = new URI(urlString);

            logger.info("ODsay API 서버로 요청을 보냅니다...");
            ResponseEntity<String> odsayResponse = restTemplate.getForEntity(uri, String.class);
            logger.info("ODsay API로부터 성공적으로 응답을 받았습니다. Status: {}", odsayResponse.getStatusCode());

            final HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            return new ResponseEntity<>(odsayResponse.getBody(), headers, odsayResponse.getStatusCode());

        } catch (Exception e) {
            logger.error("알 수 없는 오류 발생!", e);
            return ResponseEntity.status(500).body("{\"error\": \"An unexpected error occurred on the server.\"}");
        }
    }

    private void disableSslVerification() {
        try {
            TrustManager[] trustAllCerts = new TrustManager[]{ new X509TrustManager() {
                public X509Certificate[] getAcceptedIssuers() { return null; }
                public void checkClientTrusted(X509Certificate[] certs, String authType) { }
                public void checkServerTrusted(X509Certificate[] certs, String authType) { }
            }};
            SSLContext sc = SSLContext.getInstance("SSL");
            sc.init(null, trustAllCerts, new java.security.SecureRandom());
            HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());
            HostnameVerifier allHostsValid = (hostname, session) -> true;
            HttpsURLConnection.setDefaultHostnameVerifier(allHostsValid);
        } catch (Exception e) {
            logger.error("SSL 검증 비활성화 중 에러 발생", e);
        }
    }
}
