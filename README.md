# ميزان — دفترك المالي، بكل وضوح

تطبيق مصروفات عربي بالكامل، يعمل على الويب وعلى الجوال (أندرويد + iOS) عبر Capacitor.
مع Firebase يعمل التطبيق بحساب Google: تُحفظ البيانات في حسابك وتُستعاد بعد حذف التطبيق وإعادة تثبيته. وبدون إعداد Firebase يبقى التطبيق يعمل محلياً بالكامل.

## التشغيل على الويب

```bash
npm.cmd install
npm.cmd run dev
```

افتح `http://localhost:4173/`.

## إعداد Firebase (خطوة بخطوة)

1. افتح [Firebase Console](https://console.firebase.google.com/) وأنشئ مشروعاً باسم `mizan` (أو استخدم مشروعاً موجوداً).
2. من **Authentication → Sign-in method** فعّل موفر **Google** واحفظ.
3. من **Firestore Database** أنشئ قاعدة بيانات في وضع الإنتاج، ثم الصق قواعد الأمان التالية في تبويب **Rules**:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. من **Project settings → Your apps** أضف تطبيق ويب (`</>`) وانسخ قيم الـ config.
5. انسخ `.env.example` إلى `.env` وضع القيم:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

6. أعد تشغيل `npm.cmd run dev`. عند أول فتح سيظهر زر «المتابعة بحساب Google»، ويمكنك أيضاً المتابعة محلياً وتسجيل الدخول لاحقاً من الإعدادات.

> طالما القيم ما زالت `YOUR_...` أو فارغة، التطبيق يعمل محلياً فقط ولا تظهر شاشة الدخول — لا حاجة لحذف أي شيء.

### إعداد الجوال (أندرويد)

1. من Firebase Console أضف تطبيق أندرويد باسم الحزمة `com.mizan.app`، ونزّل `google-services.json` وضعه في `android/app/google-services.json`.
2. أضف بصمة SHA-1 لتطبيقك من **Project settings → Your apps → SHA certificate fingerprints**. تحتاجها Google Sign-In على الجوال.
3. نفّذ `npm.cmd run cap:sync` بعد أي تعديل على الكود أو الإعدادات.

### إعداد الجوال (iOS)

1. أضف تطبيق iOS في Firebase واربطه بحزمة `com.mizan.app`، ونزّل `GoogleService-Info.plist` وضعه في `ios/App/App/GoogleService-Info.plist`.
2. تأكد من تفعيل Google Sign-In في `capacitor.config.json` (موجود مسبقاً: `"providers": ["google.com"]`).

## مزامنة البيانات

- تُحفظ كل تغييراتك محلياً فوراً (Preferences على الجوال / localStorage على الويب)، ثم تُدفع إلى Firestore بعد ~١ ثانية عند تسجيل الدخول.
- عند تسجيل الدخول على جهاز جديد: تُستعاد نسخة السحابة إن كانت أحدث من نسخة الجهاز، وترفع النسخة المحلية إن كانت هي الأحدث. الجهاز الفارغ لا يكتب نسخة فارغة فوق بياناتك.
- إذا انقطع الإنترنت، تبقى البيانات محلية، وتُزامن تلقائياً عند عودة الاتصال.
- لا يمكن لغيرك قراءة بياناتك: قواعد Firestore تقصر الوصول على مالك الحساب فقط.

## البناء والنسخ للأصلي

```bash
npm.cmd run cap:sync      # بناء الويب + نسخه لمشروعي أندرويد و iOS
npm.cmd run android       # فتح مشروع أندرويد في Android Studio
npm.cmd run ios           # فتح مشروع iOS في Xcode (على macOS فقط)
```

### أندرويد
- يحتاج **Java JDK 17** و**Android Studio** (SDK) مثبتين على الجهاز.
- من Android Studio: `Build > Generate Signed Bundle / APK` أو بناء debug APK.
- أو من سطر الأوامر داخل مجلد `android`:
  ```bash
  gradlew assembleDebug
  ```
  الملف الناتج: `android/app/build/outputs/apk/debug/app-debug.apk`.

### iOS
- البناء يتطلب **macOS + Xcode**. افتح `ios/App/App.xcworkspace` واختار الـ simulator أو جهازك.

## بناء APK بدون تثبيت أدوات على جهازك (GitHub Actions)

الملف `.github/workflows/build-android.yml` يبني APK تلقائياً على سيرفر GitHub:

1. ارفع المشروع إلى مستودع جديد (المجلد `mizan` كامل — `.gitignore` يمنع رفع `node_modules` و`.env`).
2. أضف الأسرار التالية في **Settings → Secrets and variables → Actions** إن أردت تسجيل الدخول في الـ APK:
   - `FIREBASE_ANDROID_GOOGLE_SERVICES_JSON` — محتوى ملف `google-services.json` كاملاً.
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
   - إن لم تضفها سيبني التطبيق في وضع محلي فقط.
3. ادفع أي تعديل على `main` أو `master` → يبدأ البناء.
4. افتح تبويب **Actions** → آخر تشغيل → **Artifacts** → نزّل `mizan-debug-apk` وافكّ الملف بداخله لتحصل على `app-debug.apk`.

لرابط تحميل دائم بدل الـ artifact (ينتهي بعد 90 يوماً):
```bash
git tag v1.0.0
git push origin v1.0.0
```
هذا ينشئ **Release** فيه ملف APK ورابط تحميل ثابت.

## ملاحظات مهمة

- **سعر الصرف**: التطبيق يحاول جلب سعر الدولار تلقائياً عند الإقلاع. إذا فشل يستخدم آخر سعر محفوظ، ويرفض القيم غير المنطقية ويتيح إدخال السعر يدوياً في الإعدادات.
- **الإشعارات**: تعمل على التطبيق الأصلي فقط — قبل ٤/٣/٢/١ أيام، والتاسعة صباحاً يوم الاستحقاق، ثم يومياً بعد التأخير.
- **النسخ الاحتياطي**: زر «تصدير نسخة» يحفظ ملف JSON (على الجوال في Documents، وعلى الويب ينزّله المتصفح)، و«استيراد نسخة» يقرأ نفس الملف.
- **التهيئة**: بيانات البداية فارغة؛ يُدخل المستخدم بياناته بنفسه. «إعادة تعيين البيانات» تمسح النسخة المحلية وتدفع نسخة فارغة إلى حسابك أيضاً.
- **ترحيل البيانات**: بيانات النسخة التجريبية القديمة (`mizan-demo-v1`) تُنقل تلقائياً إلى المفتاح الجديد عند أول تشغيل.

## بنية المشروع

- `src/App.jsx` — المنسّق الرئيسي، الحالة، العمليات، والواجهات.
- `src/screens/` — الشاشات الأربع.
- `src/components/AuthScreen.jsx` — شاشة تسجيل الدخول عند أول فتح.
- `src/components/BootMark.jsx` — علامة الافتتاح المتحركة.
- `src/services/cloud.js` — Firebase Auth وFirestore (الدخول، الحفظ، المزامنة).
- `src/firebase.config.js` — مفاتيح Firebase من `.env` مع قيم احتياطية.
- `src/services/storage.js` — حفظ محلي (Preferences على الجوال / localStorage على الويب).
- `src/services/backup.js` — تصدير/استيراد.
- `src/services/notifications.js` — جدولة تنبيهات الفواتير والديون.
- `src/services/exchangeRate.js` — سعر الصرف مع احتياطي محلي.
- `src/i18n.js` — النصوص العربية والإنجليزية.
- `src/styles.css` — التصميم.
