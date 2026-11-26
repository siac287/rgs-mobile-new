# RGS Staff Portal - Android app (alag setup)

Yeh phone app school ke computer wale **RGS School Management System** se school Wi-Fi par judti hai. Staff apna profile dekhta hai, apni attendance dekhta hai,
aur **chehre (face) se Mark Attendance** karta hai. Attendance computer wali Staff Attendance mein usi waqt aa jati hai (time in, baad mein time out).

Design: aap ke screenshots wala layout (maroon header (desktop jaisa), maroon tiles, profile card, Personal / Official / Education tabs), RGS ke naam ke saath.

## 1. School computer (ek dafa)
1. Naya `RGS_School_Management_System_with_Website.zip` wala software chalayen (is mein `mobile_api.py` shamil hai). Software computer par chalta rehna chahiye.
2. Windows Firewall ka sawal aaye to **Allow** karein (jaise website ke liye karte hain). Router par "AP / client isolation" band ho, warna phone computer tak nahi pahunchega.
3. Computer ka address wohi hai jo Website Management mein dikhta hai, jaise `192.168.1.20:8080`.
4. **Har staff ka login:** Staff > Employee profile mein us employee ka login banayen (user name + password). Phone usi login se chalta hai.
5. **Face ke models:** pehli dafa face use hone par software khud 2 chhoti files internet se download karta hai (OpenCV YuNet + SFace, kul ~40 MB) folder
   `...\RGS School Management System\models\` mein. Agar computer par internet nahi to yeh 2 files kisi aur computer se la kar usi folder mein rakh dein:
   `face_detection_yunet_2023mar.onnx` aur `face_recognition_sface_2021dec.onnx` (opencv_zoo ke `models/face_detection_yunet` aur `models/face_recognition_sface`).
6. Har employee ki **passport photo** software mein maujood honi chahiye (face register karte waqt isi se milaya jata hai).

## 2. APK banana (Windows PC, internet ke saath)
`RGS_Mobile` folder mein **build_apk.bat** par double click karein. Yeh Java (agar na ho), Android tools aur Gradle khud download kar ke
`RGS-Staff-Portal.apk` bana deta hai. Pehli dafa 10-20 minute lag sakte hain.
Doosra tareeqa: folder ko Android Studio mein kholein aur *Build > Build APK(s)* dabayen.

## 3. Phone par lagana
APK file phone mein bhejein (USB, WhatsApp, Bluetooth), kholein, "Install unknown apps" allow karein. Phone ko **school Wi-Fi** se jorein.
App kholein > school computer ka address likhein (`192.168.1.20:8080`) > Connect > apna user name / password > Login.

## 4. Face attendance kaise chalti hai
* **Register Face:** employee ek dafa 6 tasveerein (seedha, muskura kar, thora left, thora right...) deta hai. Software check karta hai ke yeh chehra office mein registered photo se milta hai,
  warna register nahi hota (koi aur apne account par kisi ka chehra register na kare).
* **Mark Attendance:** button dabane par 4 tasveerein li jati hain (palak jhapakne ko kaha jata hai). Software sirf **usi employee** ke registered chehre se milata hai (1:1).
  Pehli dafa = time in, 1 minute ya zyada baad dobara = time out. Waqt hamesha **computer ki ghari** ka lagta hai, phone ka nahi.
* 6 nakam koshishon ke baad 10 minute ke liye rok lagti hai. Har kaam Activity Log mein "Mobile App" ke naam se likha jata hai. Staff Attendance mein "Entered By" = `Face (Mobile)`.
* Password badalne ya login band karne par phone ka purana login khud khatam ho jata hai.

## 5. Zaroori hadood (sach)
* Yeh app yahan (development machine par) **compile nahi ki ja saki**: wahan Android SDK aur internet nahi tha. App ka page (HTML/JS) aur computer wala hissa (API, face, attendance)
  browser mein asli server ke saath test hue hain, lekin APK ka Java wrapper (`MainActivity.java`) aur `build_apk.bat` pehli dafa aap ke PC / phone par chalenge.
  Agar build mein koi error aaye to error ka photo bhej dein, theek kar dunga.
* Face matching asli face models ke saath is machine par test nahi ho saki (models download nahi ho sakte the). Pehle 2-3 staff par aazma kar dekhein.
* Yeh **asli liveness detection nahi** hai: kisi ki saaf photo / video phone ke saamne rakh kar koshish ki ja sakti hai. Is liye attendance ko Principal / office ki nigrani mein rakhein.
  (Agle qadam ke taur par har attendance ki tasveer office ko dikhane ka option banaya ja sakta hai.)
* Sirf school network par chalta hai; internet se is tak koi nahi pahunch sakta.
