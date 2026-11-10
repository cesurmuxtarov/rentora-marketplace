# RENTORA — dost üçün quraşdırma və yayımlama

Bu paketdə layihənin mənbə kodu var. `node_modules` qovluğu paketə daxil edilməyib; aşağıdakı əmrlə avtomatik yaradılacaq.

## 1. VS Code-da açmaq

1. ZIP faylını ayrıca qovluğa çıxart.
2. VS Code-u aç.
3. **File → Open Folder** seç və ZIP-dən çıxan `rentora-marketplace` qovluğunu aç.
4. VS Code-da **Terminal → New Terminal** seç.
5. Terminalda bunları işə sal:

```bash
npm install
npm run dev
```

6. Terminalda göstərilən `http://localhost:5173` ünvanını brauzerdə aç.

Node.js quraşdırılmayıbsa, əvvəl Node.js-in LTS versiyasını quraşdırmaq lazımdır.

## 2. Build yoxlaması

GitHub-a göndərməzdən əvvəl:

```bash
npm run typecheck
npm test
npm run build
```

Hər iki əmr xətasız tamamlanmalıdır.

## 3. GitHub repository yaratmaq

1. GitHub hesabına daxil ol.
2. Sağ yuxarıdakı **+** düyməsindən **New repository** seç.
3. Repository adını, məsələn, `rentora-marketplace` yaz.
4. **Public** və ya **Private** seç.
5. README, `.gitignore` və license əlavə etmə — bunlar layihədə artıq var.
6. **Create repository** düyməsinə bas.

Sonra VS Code terminalında GitHub-ın göstərdiyi URL-i istifadə edərək:

```bash
git init
git add .
git commit -m "Initial RENTORA marketplace"
git branch -M main
git remote add origin https://github.com/GITHUB_ADIN/rentora-marketplace.git
git push -u origin main
```

`GITHUB_ADIN` hissəsini öz GitHub istifadəçi adı ilə əvəz et.

Vacib: `.env`, `.env.local`, Supabase service-role açarı, ödəniş açarları və başqa məxfi məlumatları GitHub-a göndərmə. `.gitignore` bunların əsas hissəsini artıq qoruyur.

## 4. Vercel-də deploy etmək

1. [vercel.com](https://vercel.com) saytına GitHub hesabı ilə daxil ol.
2. **Add New → Project** seç.
3. `rentora-marketplace` repository-sini import et.
4. Vercel adətən Vite layihəsini avtomatik tanıyacaq. Parametrlər belə olmalıdır:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Supabase istifadə ediləcəksə, **Environment Variables** bölməsində bunları əlavə et:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PAYMENT_MODE=demo`
6. **Deploy** düyməsinə bas.

`VITE_SUPABASE_ANON_KEY` brauzer üçün nəzərdə tutulan anon açardır. Supabase `service_role` açarını Vite dəyişəni kimi və ya frontend kodunda saxlamaq olmaz.

## 5. React Router üçün Vercel qaydası

Layihədəki `vercel.json` bütün daxili səhifələri `index.html`-a yönləndirir. Bu, `/explore`, `/owner`, `/listing/sony-a7` kimi ünvanlar birbaşa açılanda 404 xətasının qarşısını alır.

## 6. Real production üçün qalan işlər

- Supabase layihəsini yaratmaq və `supabase/migrations` qovluğundakı SQL migration-u tətbiq etmək
- Supabase Auth redirect URL-lərinə Vercel domenini əlavə etmək
- Listing şəkilləri üçün Storage bucket və təhlükəsizlik siyasətləri yaratmaq
- Ödəniş provayderini hosted checkout və server webhook-u ilə qoşmaq
- KYC/şəxsiyyət təsdiqi provayderini qoşmaq
- Hüquqi sənədləri Azərbaycan hüquqşünasına yoxlatmaq

Bu konfiqurasiyalar edilməyənə qədər sayt təhlükəsiz şəkildə demo rejimində qalır və real pul qəbul etmir.
