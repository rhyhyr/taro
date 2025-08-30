package com.web.taro;


import java.util.Map;


import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpSession;


@Controller
public class MyController {

@PostMapping("/list")
@ResponseBody
public ResponseEntity<String> receiveCoords(@RequestBody Map<String, Double> coords, HttpSession session) {
    double startx = coords.get("x");
    double starty = coords.get("y");

    System.out.println("📌 받은 좌표: " + startx + ", " + starty);

    // 세션에 저장
    session.setAttribute("startx", startx);
    session.setAttribute("starty", starty);

    return ResponseEntity.ok("ok");
}

@GetMapping("/list")
public String goToStartPage(HttpSession session, Model model) {
    Object startx = session.getAttribute("startx");
    Object starty = session.getAttribute("starty");

    model.addAttribute("startx", startx);
    model.addAttribute("starty", starty);
    
    return "list";
}

@GetMapping("/speech")
public String goToStartPage() {
    return "speech"; // templates/start.html
}

//@GetMapping("/confirm")
//public String confirm(@RequestParam(name="dest") String dest, Model mo) {
//	mo.addAttribute("dest", dest);
//    return "confirm"; // templates/confirm.html
//}

@GetMapping("/path")
public String transfer(@RequestParam("x") double x, @RequestParam("y") double y, HttpSession session, Model model) {
	Object startx = session.getAttribute("startx");
    Object starty = session.getAttribute("starty");

    model.addAttribute("startx", startx);
    model.addAttribute("starty", starty);
    
    // 모델에 좌표 저장
    model.addAttribute("x", x);
    model.addAttribute("y", y);

    return "path"; // templates/transfer.html
}




} // class {} 닫기
