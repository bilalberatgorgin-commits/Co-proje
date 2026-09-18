// 1. Firebase Bağlantı Ayarları
// (Firebase Console -> Proje Ayarları kısmından aldığınız kendi değerlerinizle değiştirin)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase'i Başlat
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 2. SAYFA YÜKLENDİĞİNDE OTURUM VE 3 GİRİŞ KONTROLÜ
auth.onAuthStateChanged(async (user) => {
  const durum = document.getElementById("durumMesaji");

  if (user) {
    const userDoc = await db.collection("users").doc(user.uid).get();
    
    if (userDoc.exists) {
      let loginCount = userDoc.data().loginCount || 0;

      // KONTROL: Eğer 3 giriş hakkı dolduysa hesaptan çıkar
      if (loginCount >= 3) {
        alert("Güvenliğiniz için 3 girişte bir tekrar giriş yapmanız gerekmektedir.");
        
        // Giriş sayısını tekrar 0 yap ve çıkış yaptır
        await db.collection("users").doc(user.uid).update({ loginCount: 0 });
        cikisYap();
        return;
      }

      if (durum) {
        durum.innerText = `Hoş geldiniz: ${user.email} (Toplam Giriş Sayısı: ${loginCount})`;
      }
    }
  } else {
    if (durum) {
      durum.innerText = "Giriş yapılmadı.";
    }
  }
});

// 3. KAYIT OLMA FONKSİYONU
async function kayitOl() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    
    // Veritabanına (Firestore) Kullanıcı Bilgisini Kaydet
    await db.collection("users").doc(result.user.uid).set({
      email: email,
      loginCount: 1, // İlk kayıt 1. giriş sayılır
      createdAt: new Date()
    });

    alert("Kayıt başarılı! Oturum açıldı.");
  } catch (error) {
    alert("Kayıt hatası: " + error.message);
  }
}

// 4. GİRİŞ YAPMA FONKSİYONU
async function girisYap() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const rememberMe = document.getElementById("rememberMe") ? document.getElementById("rememberMe").checked : false;

  try {
    // "Beni Hatırla" işaretlendiyse kalıcı, işaretlenmediyse oturum kapanınca silinen oturum
    const persistenceType = rememberMe 
      ? firebase.auth.Auth.Persistence.LOCAL 
      : firebase.auth.Auth.Persistence.SESSION;

    await auth.setPersistence(persistenceType);

    // Giriş İşlemi
    const result = await auth.signInWithEmailAndPassword(email, password);
    
    // Veritabanındaki Giriş Sayısını (loginCount) 1 Artır
    const userRef = db.collection("users").doc(result.user.uid);
    const userDoc = await userRef.get();
    
    let currentCount = userDoc.exists ? (userDoc.data().loginCount || 0) : 0;
    let newCount = currentCount + 1;

    await userRef.update({ loginCount: newCount });

    alert(`Giriş Başarılı! (Bu ${newCount}. girişiniz)`);
  } catch (error) {
    alert("Giriş hatası: " + error.message);
  }
}

// 5. ÇIKIŞ YAPMA FONKSİYONU
function cikisYap() {
  auth.signOut().then(() => {
    alert("Çıkış yapıldı.");
  });
}
