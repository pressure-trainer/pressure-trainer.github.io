(function () {
  'use strict';

  // ===================== CONFIG / SUPABASE =====================
  var CONFIGURED = window.SUPABASE_URL && window.SUPABASE_URL.indexOf('PASTE_YOUR') !== 0 &&
                   window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY.indexOf('PASTE_YOUR') !== 0;
  var sb = CONFIGURED ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;

  // ===================== STATIC CONTENT DATA =====================
  var ROLE_LABELS = { CB: 'בלם מרכזי', RB: 'מגן ימין', LB: 'מגן שמאל' };
  var ROLE_DEFS = [
    { code: 'CB', abbr: 'בלם', name: 'בלם מרכזי', desc: 'שקט, מעברי צד, כדור ארוך תחת לחץ' },
    { code: 'RB', abbr: 'ימין', name: 'מגן ימין', desc: '1 מול 1 מול כנפיים, ריצות חפיפה, מצבים צפופים' },
    { code: 'LB', abbr: 'שמאל', name: 'מגן שמאל', desc: 'מראה של מגן ימין, הטיה לתרחישי רגל שמאל' }
  ];
  var CAL_QUESTIONS = [
    { q: 'איך תדרג את הסריקה שלך לפני קבלת הכדור?', opts: ['נמוך', 'בינוני', 'גבוה'] },
    { q: 'מצב הלחץ הכי לא נוח?', opts: ['1 מול 1', '2 מול 1', 'כדור ארוך'] },
    { q: 'נגיעה ראשונה מועדפת תחת לחץ?', opts: ['אחורה', 'הצידה', 'קדימה'] }
  ];
  var TRAIN_MODES = [
    { icon: '◎', name: 'סריקה וזיהוי', desc: 'הרם ראש לפני קבלת הכדור — זהה צבעים, מספרים וכיוונים.', level: 'בסיס', last: 'אתמול', screen: 'scan', iconBg: 'var(--accent)' },
    { icon: '⚡', name: 'קבלת החלטות', desc: 'הגב בשבריר שנייה — שטח פתוח מול מגן לוחץ, תחת לחץ זמן.', level: 'בינוני', last: 'היום', screen: 'drill', iconBg: 'var(--navy)' },
    { icon: '⇄', name: 'סריקה כפולה · פס עומק', desc: 'שתי סריקות ברצף — אחת קובעת פתיחה, השנייה קובעת פס עומק. תחת לחץ זמן.', level: 'מתקדם', last: 'חדש', screen: 'doublescan', iconBg: '#2E5FD8' }
  ];
  var PRO_PROGRAM = [
    { range: 'אימונים 1–4', level: 'בסיס', desc: 'זיהוי צבעים פשוט והרמת ראש בזמן כדרור איטי.', pct: 100, label: '4/4' },
    { range: 'אימונים 5–8', level: 'בינוני', desc: 'מספרים וחצים — פעולה מתמטית קלה וזיהוי כיוון תוך שינויי קצב.', pct: 50, label: '2/4' },
    { range: 'אימונים 9–12', level: 'מתקדם', desc: 'סימולציות משחק מלאות, קצב מהיר ותנועה במרחב.', pct: 0, label: '0/4' }
  ];
  var BADGES = [
    { icon: '🔥', name: 'רצף 23 ימים', color: '#E05555' },
    { icon: '⚡', name: 'ממוצע מתחת ל-1.5ש׳', color: 'var(--accent)' },
    { icon: '◈', name: '1000 תרגילים', color: '#4CAF70' },
    { icon: '▲', name: 'טיימר רמה 5', color: '#E0A93A' }
  ];
  var RECENT_SESSIONS = [
    { icon: '◈', name: 'תרגיל לחץ · 2 מול 1', when: 'אתמול · 8 חזרות', score: '88%', good: true },
    { icon: '◎', name: 'סימולטור סריקה', when: 'לפני 3 ימים · 6 חזרות', score: '82%', good: true },
    { icon: '⏱', name: 'טיימר החלטה', when: 'לפני 5 ימים · רמה 4', score: '71%', good: false }
  ];
  var RANGE_DATA = {
    '7d': [1.9, 1.82, 1.76, 1.7, 1.61, 1.53, 1.42],
    '30d': [2.1, 2.0, 1.95, 1.86, 1.78, 1.7, 1.6, 1.52, 1.46, 1.42],
    'all': [2.6, 2.4, 2.2, 2.05, 1.9, 1.75, 1.6, 1.5, 1.42]
  };
  var RADAR_AXES = [['1 מול 1', 78], ['2 מול 1', 54], ['מעבר צד', 82], ['שוער', 88], ['כדור ארוך', 66]];
  var WEEK_BARS_DATA = [4, 5, 3, 6, 5, 7, 6, 8];
  var HOME_STATS = [{ value: '1.42s', label: 'זמן החלטה ממוצע' }, { value: '6', label: 'סשנים השבוע' }, { value: '23', label: 'רצף שיא' }];
  var THEME_LABELS = { cream: 'פיקוד קרם', dark: 'מצב לילה', hybrid: 'מגרש היברידי' };
  var DRILL_WINDOW_MS = 3000;

  function scenarios() {
    return [
      { text:'לוחץ מגיע מימין. המגן חופשי רחב בשמאל.', opts:[
        {key:'א',label:'העבר שמאלה למגן', ok:true},
        {key:'ב',label:'כדרר קדימה לתוך הלחץ', ok:false},
        {key:'ג',label:'אחורה לשוער', ok:false}], why:{
          true:'נכון. מעבר הרחק מהלחץ אל השחקן החופשי שומר על החזקה ומותח את הלחץ שלהם.',
          false:'השחקן החופשי היה רחב בשמאל — כניסה ללחץ או מסירה אחורה הזמינו את המלכודת.'} },
      { text:'שניים לוחצים עליך, השוער זז לתמיכה.', opts:[
        {key:'א',label:'הברח את הכדור לאורך הקו', ok:false},
        {key:'ב',label:'מסור אחורה לשוער', ok:true},
        {key:'ג',label:'הסתובב לתוך שני הלוחצים', ok:false}], why:{
          true:'נכון. תחת לחץ של שניים עם תמיכת שוער, אפס דרך השוער כדי לפתוח מחדש זוויות.',
          false:'שניים עליך בלי זווית קדימה — האיפוס הבטוח היה השוער.'} },
      { text:'הכנף לוחץ מבחוץ; נפתח מרחב לפניך.', opts:[
        {key:'א',label:'צעד קדימה עם הכדור', ok:true},
        {key:'ב',label:'מסירה עיוורת לרוחב הרחבה', ok:false},
        {key:'ג',label:'שחרר כדור ארוך', ok:false}], why:{
          true:'נכון. כשהלחץ חד-צדדי ויש מרחב קדימה, הובל את הכדור כדי לשבור את הקו.',
          false:'המרחב היה לפנים — מסירה רוחבית מסוכנת או שחרור מבזבזים הזדמנות להתקדם.'} },
      { text:'לחץ מהגב; שחקן חופשי בקו האמצע.', opts:[
        {key:'א',label:'נגיעה ראשונה לצד, אל הקו האמצעי', ok:true},
        {key:'ב',label:'עצור את הכדור מתחת לרגל', ok:false},
        {key:'ג',label:'סובב לאחור לתוך הלוחץ', ok:false}], why:{
          true:'נכון. תחת לחץ מהגב, נגיעה ראשונה לצד פותחת זווית מסירה בלי לחשוף את הגב.',
          false:'עצירה או סיבוב לתוך הלוחץ מאבדים את הכדור באזור מסוכן.'} },
      { text:'איבוד כדור קרוב — הזדמנות לקונטרה מיידית.', opts:[
        {key:'א',label:'לחץ מיידי לניתוק הכדור', ok:true},
        {key:'ב',label:'נסיגה מהירה להגנה', ok:false},
        {key:'ג',label:'המתן שהקבוצה תתארגן', ok:false}], why:{
          true:'נכון. 6 השניות הראשונות אחרי איבוד הן ההזדמנות הכי טובה לנתק לפני שהיריב מתארגן.',
          false:'נסיגה או המתנה נותנות ליריב זמן לצאת בקלות מהלחץ.'} },
      { text:'עומס באמצע — שלושה יריבים בין הקווים.', opts:[
        {key:'א',label:'מסירה אחורה לאיפוס המבנה', ok:true},
        {key:'ב',label:'מסירה מסוכנת בין הקווים', ok:false},
        {key:'ג',label:'כדרור ישר לתוך העומס', ok:false}], why:{
          true:'נכון. כשהמרכז צפוף, איפוס אחורה שומר על סבלנות ופותח מחדש את הזוויות.',
          false:'מסירה או כדרור לתוך העומס מסתכנים באיבוד מיידי במקום הכי מסוכן.'} },
      { text:'לחץ גבוה ליד הרחבה שלך; השוער פתוח בצד.', opts:[
        {key:'א',label:'מסירה קצרה ורגועה לשוער', ok:true},
        {key:'ב',label:'בעיטה ארוכה מתחת ללחץ', ok:false},
        {key:'ג',label:'ניסיון דריבל בתוך הרחבה', ok:false}], why:{
          true:'נכון. ליד הרחבה שלך, מסירה בטוחה לשוער שומרת על החזקה ומזיזה את הלחץ.',
          false:'בעיטה ארוכה מתחת ללחץ או דריבל בתוך הרחבה מסוכנים מדי באזור הזה.'} },
      { text:'שני יריבים סוגרים משני הצדדים; פינה פתוחה מאחור.', opts:[
        {key:'א',label:'נגיעה אחורה לפינה הפתוחה', ok:true},
        {key:'ב',label:'נסה לעבור בין השניים', ok:false},
        {key:'ג',label:'מסירה קדימה תחת לחץ כפול', ok:false}], why:{
          true:'נכון. כשסוגרים משני הצדדים, נגיעה לפינה הפתוחה היא המוצא הבטוח ביותר.',
          false:'מעבר בין שני לוחצים או מסירה קדימה תחת לחץ כפול מסתכנים מדי.'} },
      { text:'לחץ קל מהצד; יש לך זמן וזווית ישרה קדימה.', opts:[
        {key:'א',label:'מסירה ישרה ומדויקת קדימה', ok:true},
        {key:'ב',label:'החזק כדור מיותר ותן ללחץ לגדול', ok:false},
        {key:'ג',label:'מסירה רוחבית לא נחוצה', ok:false}], why:{
          true:'נכון. כשיש זמן וזווית, נצל את זה מיד למסירה מתקדמת ואל תוותר על ההזדמנות.',
          false:'החזקה מיותרת נותנת ללחץ להתארגן; מסירה רוחבית מבזבזת הזדמנות טובה קדימה.'} },
      { text:'לחץ מהצד תוך כדרור; חלוץ שלך רץ בחפיפה בחוץ.', opts:[
        {key:'א',label:'מסירה לרגל של הרץ בחפיפה', ok:true},
        {key:'ב',label:'המשך כדרור ישר לתוך הלוחץ', ok:false},
        {key:'ג',label:'עצור ותחפש אופציה אחרת', ok:false}], why:{
          true:'נכון. הרץ בחפיפה פתוח ונע — מסירה מדויקת מנטרלת את הלחץ מיד.',
          false:'כדרור לתוך הלוחץ או עצירה מיותרת מאבדים את התזמון של הריצה.'} },
      { text:'כדור ארוך מגיע אליך בזמן שלוחץ מתקרב מהגב.', opts:[
        {key:'א',label:'נגיעה ראשונה סובבת החוצה מהלחץ', ok:true},
        {key:'ב',label:'עצור את הכדור ישר תחת הרגל', ok:false},
        {key:'ג',label:'נסה נגיעה ראשונה קדימה לתוך הלוחץ', ok:false}], why:{
          true:'נכון. נגיעה ראשונה שסובבת הרחק מכיוון הלחץ קונה זמן ומרחב.',
          false:'עצירה ישרה או נגיעה לתוך הלחץ מאפשרות ללוחץ לזכות בכדור מיד.'} },
      { text:'לחץ כפול קרוב לקו הצד; יש אופציית חיתוך פנימה.', opts:[
        {key:'א',label:'חיתוך פנימה לשחקן החופשי', ok:true},
        {key:'ב',label:'נסה לעבור לאורך הקו בין השניים', ok:false},
        {key:'ג',label:'מסירה ארוכה חסרת מטרה', ok:false}], why:{
          true:'נכון. ליד קו הצד עם לחץ כפול, חיתוך פנימה לשחקן חופשי הוא המוצא הבטוח.',
          false:'ניסיון מעבר בין שני לוחצים או בעיטה חסרת כיוון מסתכנים באיבוד מיידי.'} },
      { text:'הלחץ מגיע באיחור; יש לך רגע לפני שהוא מגיע אליך.', opts:[
        {key:'א',label:'הסתובב מיד והתקדם עם הכדור', ok:true},
        {key:'ב',label:'המתן שהלוחץ יגיע ואז תחליט', ok:false},
        {key:'ג',label:'מסירה מיותרת לאחור בלי צורך', ok:false}], why:{
          true:'נכון. כשהלחץ מאחר, זה הרגע להסתובב ולנצל את המרחב לפני שהוא נסגר.',
          false:'המתנה מבזבזת את החלון הקצר; מסירה אחורה מיותרת כשאין באמת לחץ.'} },
      { text:'זכית בכדור עמוק בשטח שלך; אגף פתוח רחוק.', opts:[
        {key:'א',label:'מסירה ישירה ומהירה לאגף הפתוח', ok:true},
        {key:'ב',label:'החזק כדור ותן ליריב להתארגן', ok:false},
        {key:'ג',label:'מסירה קצרה חזרה ללחץ', ok:false}], why:{
          true:'נכון. ברגע הזכייה, מסירה ישירה לאגף הפתוח מנצלת את חוסר הארגון של היריב.',
          false:'החזקה מיותרת נותנת ליריב להתארגן מחדש ולסגור את המרחב.'} },
      { text:'עומס מרכזי — ארבעה יריבים בין הקווים, שטח פתוח באגף.', opts:[
        {key:'א',label:'החלף משחק לאגף הפתוח', ok:true},
        {key:'ב',label:'נסה מסירה ישרה דרך העומס', ok:false},
        {key:'ג',label:'כדרור בודד לתוך העומס', ok:false}], why:{
          true:'נכון. כשהמרכז עמוס, החלפת משחק לאגף פותחת את המשחק מחדש.',
          false:'מסירה או כדרור דרך עומס של ארבעה שחקנים מסתכנים באיבוד מיידי.'} },
      { text:'לחץ גבוה עם מלכודת; חלוץ יורד לקצר מרחב פתיחה.', opts:[
        {key:'א',label:'מסירה קצרה לחלוץ היורד', ok:true},
        {key:'ב',label:'בעיטה ארוכה מעל המלכודת', ok:false},
        {key:'ג',label:'כדרור ישר לתוך המלכודת', ok:false}], why:{
          true:'נכון. החלוץ היורד שובר את הלחץ הגבוה ופותח מסירה קדימה מהירה.',
          false:'בעיטה ארוכה חסרת מטרה או כדרור לתוך המלכודת מאבדים החזקה מיד.'} },
      { text:'לחץ קל; יש לך זמן להחליף כיוון משחק ארוך.', opts:[
        {key:'א',label:'החלף כיוון עם מסירה ארוכה ומדויקת', ok:true},
        {key:'ב',label:'המתן ותן ללחץ לגדול', ok:false},
        {key:'ג',label:'מסירה קצרה מיותרת לאחור', ok:false}], why:{
          true:'נכון. כשיש זמן ומרחב, החלפת כיוון ארוכה מפתיעה את המבנה ההגנתי היריב.',
          false:'המתנה או מסירה מיותרת מבזבזות הזדמנות טובה לפתוח את המשחק.'} },
      { text:'שני יריבים סוגרים במשולש; מבוגר תומך מאחור פתוח.', opts:[
        {key:'א',label:'מסירה חזרה לתומך הפתוח', ok:true},
        {key:'ב',label:'נסה לצאת דרך המשולש', ok:false},
        {key:'ג',label:'מסירה קדימה תחת סגירה כפולה', ok:false}], why:{
          true:'נכון. כשסוגרים במשולש, התומך מאחור הוא המוצא הבטוח לאיפוס.',
          false:'יציאה דרך המשולש או מסירה קדימה תחת לחץ כפול מסתכנים מדי.'} },
      { text:'איבדת כדור באמצע; היריב עוד לא התארגן להתקפה.', opts:[
        {key:'א',label:'לחץ מיידי על נושא הכדור', ok:true},
        {key:'ב',label:'חזור מיד לקו ההגנה', ok:false},
        {key:'ג',label:'התעלם והמתן לכיסוי חברים', ok:false}], why:{
          true:'נכון. לחץ מיידי בשניות הראשונות מונע מהיריב לצאת בקלות מהמעבר.',
          false:'נסיגה מיידית או המתנה נותנות ליריב זמן להתארגן ולהתקדם בנוחות.'} },
      { text:'לחץ אגבי מאחור בזמן קבלת כדור; יש שטח קדימה.', opts:[
        {key:'א',label:'נגיעה ראשונה קדימה לשטח הפתוח', ok:true},
        {key:'ב',label:'עצור והמתן ללחץ', ok:false},
        {key:'ג',label:'סובב לאחור לתוך הלוחץ', ok:false}], why:{
          true:'נכון. כשיש שטח קדימה, נגיעה ראשונה שם מנצלת מיידית את המרחב.',
          false:'עצירה או סיבוב לאחור מאבדים את המרחב הפתוח ומחזירים את הלחץ.'} },
      { text:'לחץ 3 מול 2 לרעתך באגף; שוער יכול לתמוך.', opts:[
        {key:'א',label:'מסירה אחורה לשוער לאיפוס', ok:true},
        {key:'ב',label:'נסה לפרוץ 3 מול 2', ok:false},
        {key:'ג',label:'מסירה מסוכנת רוחבית', ok:false}], why:{
          true:'נכון. בנחיתות מספרית של 3 מול 2, השוער הוא המוצא הבטוח ביותר לאיפוס.',
          false:'ניסיון פריצה בנחיתות מספרית או מסירה רוחבית מסוכנת מסתכנים מדי.'} },
      { text:'לחץ נמוך יחסית; יש לך זמן לכדרר ולמשוך שחקן.', opts:[
        {key:'א',label:'כדרר קצר כדי למשוך יריב ולפתוח מסירה', ok:true},
        {key:'ב',label:'מסירה מיידית ללא צורך', ok:false},
        {key:'ג',label:'בעיטה ארוכה מיותרת', ok:false}], why:{
          true:'נכון. כשהלחץ נמוך, כדרור קצר יכול למשוך יריב ולפתוח קו מסירה חדש.',
          false:'מסירה מיידית מבזבזת הזדמנות; בעיטה ארוכה מוותרת על החזקה בלי סיבה.'} },
      { text:'לחץ גבוה קרוב לרחבה שלך; המרכזי השני פתוח בצד.', opts:[
        {key:'א',label:'מסירה רגועה לבלם השני', ok:true},
        {key:'ב',label:'ניסיון דריבל מסוכן ברחבה', ok:false},
        {key:'ג',label:'בעיטה חפוזה בלי מטרה', ok:false}], why:{
          true:'נכון. מסירה רגועה לבלם השני שומרת על החזקה ומזיזה את הלחץ הצידה.',
          false:'דריבל מסוכן ברחבה או בעיטה חפוזה מגדילים סיכון קריטי ליד השער.'} },
      { text:'קיבלת כדור בגב לשער; לוחץ צמוד מאחור.', opts:[
        {key:'א',label:'נגיעה ראשונה לצד שפותח זווית', ok:true},
        {key:'ב',label:'נסה לסובב ישר לתוך הלוחץ', ok:false},
        {key:'ג',label:'עצור את הכדור בלי תגובה', ok:false}], why:{
          true:'נכון. עם הגב לשער ולוחץ צמוד, נגיעה לצד פותחת זווית מסירה בטוחה.',
          false:'סיבוב ישר לתוך הלוחץ או עצירה בלי תגובה מאבדים כדור מסוכן.'} },
      { text:'מצב קונטרה נגדך; יריב אחד רץ לבד לעברך.', opts:[
        {key:'א',label:'עכב אותו והכוון לצד הפחות מסוכן', ok:true},
        {key:'ב',label:'רדוף ישר בלי לעכב', ok:false},
        {key:'ג',label:'עמוד במקום ותחכה', ok:false}], why:{
          true:'נכון. עיכוב תוך הכוונה לצד פחות מסוכן קונה זמן לחברי הקבוצה לחזור.',
          false:'רדיפה ישרה או עמידה במקום נותנות ליריב אופציה נוחה לסיים את המצב.'} },
      { text:'לחץ מתפרק — היריב איבד כיסוי צד אחד.', opts:[
        {key:'א',label:'נצל את הצד הפתוח מיד', ok:true},
        {key:'ב',label:'החזק כדור בלי לנצל את הפער', ok:false},
        {key:'ג',label:'מסירה לצד הסגור', ok:false}], why:{
          true:'נכון. כשהלחץ מתפרק, ניצול מיידי של הצד הפתוח מקדם את הכדור בבטחה.',
          false:'החזקה מיותרת או מסירה לצד הסגור מוותרות על הזדמנות שנפתחה.'} },
      { text:'לחץ אחרי כדור מת (קרן); כדור שני מגיע אליך.', opts:[
        {key:'א',label:'נגיעה ראשונה החוצה מהאזור הצפוף', ok:true},
        {key:'ב',label:'נסה לעצור בתוך הצפיפות', ok:false},
        {key:'ג',label:'בעיטה עיוורת קדימה', ok:false}], why:{
          true:'נכון. באזור צפוף אחרי כדור מת, נגיעה החוצה מהצפיפות היא הבטוחה ביותר.',
          false:'עצירה בצפיפות או בעיטה עיוורת מגדילות סיכון לאיבוד מסוכן.'} },
      { text:'לחץ צמוד עם צל כיסוי שחוסם קו מסירה מרכזי.', opts:[
        {key:'א',label:'מסירה אלכסונית סביב הצל', ok:true},
        {key:'ב',label:'נסה מסירה ישרה דרך הצל', ok:false},
        {key:'ג',label:'החזק כדור בלי פתרון', ok:false}], why:{
          true:'נכון. מסירה אלכסונית עוקפת את צל הכיסוי ומגיעה לשחקן החופשי באמת.',
          false:'מסירה ישרה דרך הצל נחסמת בקלות; החזקה בלי פתרון נותנת ללחץ לגדול.'} }
    ];
  }

  // ===================== STATE =====================
  var state = {
    screen: 'splash',
    theme: 'cream',
    role: 'CB',
    range: '7d',
    userId: null,
    profile: null,
    profileExists: false,
    calSel: [1, 1, 1],
    dPhase: 'idle', dRep: 1, dStreak: 0, dTimeLeft: 0, dScenario: 0, dResult: null, dOppNear: false, dDecTime: 0,
    sPhase: 'idle', sRep: 1, sDots: [], sRed: 0, sFreeSide: 'Left', sAnswered: null, sQType: 0,
    ds2Phase: 'idle', ds2Rep: 1, ds2Count: 3, ds2Color1: null, ds2FlashSec: 1.5
  };
  var timers = { drill: null, scan: null, ds: null };
  var el = {};

  function q(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clearTimers() {
    clearInterval(timers.drill); timers.drill = null;
    clearTimeout(timers.scan); timers.scan = null;
    clearTimeout(timers.ds); timers.ds = null;
  }
  function applyTheme(theme) { document.documentElement.setAttribute('data-theme', theme); }

  var SECTIONS = ['splashScreen', 'loginScreen', 'registerScreen', 'onboardingScreen', 'waitingScreen', 'mainApp'];
  function showOnly(id) {
    SECTIONS.forEach(function (k) { el[k].style.display = (k === id) ? '' : 'none'; });
  }

  var NAV_SCREENS = ['home', 'train', 'progress', 'profile'];
  function goScreen(name) {
    clearTimers();
    state.screen = name;
    if (name === 'splash') { showOnly('splashScreen'); return; }
    if (name === 'login') { showOnly('loginScreen'); return; }
    if (name === 'register') { showOnly('registerScreen'); return; }
    if (name === 'onboarding') { showOnly('onboardingScreen'); renderOnboarding(); return; }
    if (name === 'waiting') { showOnly('waitingScreen'); return; }
    showOnly('mainApp');
    render();
  }

  // ===================== RENDER DISPATCH =====================
  function render() {
    var showNav = NAV_SCREENS.indexOf(state.screen) !== -1;
    el.statusBar.style.display = showNav ? '' : 'none';
    el.bottomNav.style.display = showNav ? '' : 'none';
    el.screenContent.className = showNav ? 'pr-screen pr-scroll' : 'pr-noscroll';
    var html = '';
    switch (state.screen) {
      case 'home': html = buildHome(); break;
      case 'train': html = buildTrain(); break;
      case 'drill': html = buildDrill(); break;
      case 'scan': html = buildScan(); break;
      case 'doublescan': html = buildDoubleScan(); break;
      case 'progress': html = buildProgress(); break;
      case 'profile': html = buildProfile(); break;
    }
    el.screenContent.innerHTML = html;
    if (showNav) el.bottomNav.innerHTML = buildBottomNav();
  }

  // ===================== ONBOARDING =====================
  function renderOnboarding() {
    var p = state.profile || {};
    var fn = p.first_name || '';
    var rolesHtml = ROLE_DEFS.map(function (r) {
      var sel = state.role === r.code;
      return '<div class="pr-role-card' + (sel ? ' selected' : '') + '" data-action="pickRole" data-role="' + r.code + '">' +
        '<div class="pr-role-icon">' + r.abbr + '</div>' +
        '<div style="flex:1"><div class="pr-role-name">' + r.name + '</div><div class="pr-role-desc">' + r.desc + '</div></div>' +
        (sel ? '<div class="pr-role-check">✓</div>' : '') +
        '</div>';
    }).join('');
    var calHtml = CAL_QUESTIONS.map(function (c, qi) {
      var optsHtml = c.opts.map(function (label, oi) {
        var sel = state.calSel[qi] === oi;
        return '<div class="pr-cal-opt' + (sel ? ' selected' : '') + '" data-action="pickCal" data-q="' + qi + '" data-i="' + oi + '">' + label + '</div>';
      }).join('');
      return '<div class="pr-card pr-cal-card"><div class="pr-cal-q">' + c.q + '</div><div class="pr-cal-opts">' + optsHtml + '</div></div>';
    }).join('');
    // When the profile has no name yet (e.g. an account that already existed
    // in this Supabase project, before it had a Pressure profile), collect the
    // name + team here so the created profile isn't nameless.
    var needsDetails = !state.profileExists;
    var detailsHtml = needsDetails ?
      ('<div class="pr-onb-section" style="margin-top:0">הפרטים שלך</div>' +
       '<div class="pr-auth-fields">' +
       '<div><div class="pr-field-label">שם פרטי</div><input id="onbName" class="pr-input" type="text" placeholder="נועם" value="' + esc(p.first_name || '') + '"></div>' +
       '<div><div class="pr-field-label">קבוצה</div><input id="onbTeam" class="pr-input" type="text" placeholder="שם הקבוצה" value="' + esc(p.team || '') + '"></div>' +
       '</div>') : '';
    el.onboardingScreen.innerHTML =
      '<div class="pr-onb-kicker">ברוך הבא' + (fn ? ', ' + esc(fn) : '') + '</div>' +
      '<div class="pr-onb-title">אמן את המחשבה.<br>נצח את הלחץ.</div>' +
      (needsDetails ? '<div style="height:22px"></div>' + detailsHtml : '') +
      '<div class="pr-onb-section">בחר את התפקיד שלך</div>' +
      '<div class="pr-role-list">' + rolesHtml + '</div>' +
      '<div class="pr-onb-section">כיול מהיר</div>' +
      '<div class="pr-cal-list">' + calHtml + '</div>' +
      '<button class="pr-btn pr-btn-primary pr-onb-finish" data-action="finishOnboarding">התחל אימון</button>';
  }

  function finishOnboarding() {
    var role = state.role;
    var p = state.profile || {};
    var nameInput = q('onbName');
    var teamInput = q('onbTeam');
    if (nameInput) p.first_name = nameInput.value.trim();
    if (teamInput) p.team = teamInput.value.trim() || 'הקבוצה שלי';
    p.role = role;
    state.profile = p;
    var done = function () {
      goScreen(p.approved ? 'home' : 'waiting');
    };
    if (sb && state.userId) {
      if (state.profileExists) {
        // profile row already exists (fresh registration) — just update it.
        sb.from('profiles').update({
          first_name: p.first_name || '', team: p.team || 'הקבוצה שלי',
          role: role, theme: p.theme || state.theme || 'cream'
        }).eq('id', state.userId).then(done);
      } else {
        // no profile row yet (logged into a pre-existing account) — create one.
        var row = {
          id: state.userId,
          first_name: p.first_name || '', last_name: p.last_name || '',
          team: p.team || 'הקבוצה שלי', role: role, theme: p.theme || state.theme || 'cream',
          streak_days: p.streak_days != null ? p.streak_days : 1,
          total_hours: p.total_hours != null ? p.total_hours : 0,
          drills_completed: p.drills_completed != null ? p.drills_completed : 0
        };
        sb.from('profiles').insert(row).then(function (res) {
          if (!res.error) state.profileExists = true;
          done();
        });
      }
    } else {
      done();
    }
  }

  function recheckApproval() {
    if (!sb) return;
    el.waitingRecheck.disabled = true;
    sb.auth.getSession().then(function (res) {
      el.waitingRecheck.disabled = false;
      var session = res.data && res.data.session;
      if (session) { onLoggedIn(session); } else { goScreen('login'); }
    });
  }

  // ===================== HOME =====================
  function buildHome() {
    var p = state.profile || {};
    var fn = p.first_name || '';
    var streak = p.streak_days != null ? p.streak_days : 1;
    var d = new Date();
    var todayLabel = d.toLocaleDateString('he-IL', { weekday: 'long', month: 'long', day: 'numeric' });
    var statsHtml = HOME_STATS.map(function (s) {
      return '<div class="pr-card pr-stat-tile"><div class="pr-stat-value">' + s.value + '</div><div class="pr-stat-label">' + s.label + '</div></div>';
    }).join('');
    return '' +
      '<div class="pr-today">' + todayLabel + '</div>' +
      '<div class="pr-greeting">מוכן לאמן, ' + esc(fn) + '?</div>' +
      '<div class="pr-challenge"><div class="pr-challenge-inner">' +
      '<div class="pr-challenge-top"><div class="pr-challenge-kicker">אתגר יומי</div>' +
      '<div class="pr-streak-pill">🔥 רצף של ' + streak + ' ימים</div></div>' +
      '<div class="pr-challenge-title">לחץ 2 מול 1 · אגף שמאל</div>' +
      '<div class="pr-challenge-desc">מותאם לנקודת החולשה שלך: לחץ משניים.</div>' +
      '<div class="pr-challenge-meta"><span>⏱ ~5 דק\'</span><span>◈ 8 חזרות</span><span>▲ מסתגל</span></div>' +
      '<button class="pr-btn pr-btn-primary" data-action="go" data-screen="drill">התחל את הסשן של היום</button>' +
      '</div></div>' +
      '<div class="pr-stats-grid">' + statsHtml + '</div>' +
      '<div class="pr-section-label">המשך אימון</div>' +
      '<div class="pr-card pr-continue-row" data-action="go" data-screen="scan">' +
      '<div class="pr-continue-icon">▸</div>' +
      '<div style="flex:1"><div class="pr-continue-title">סימולטור סריקה</div><div class="pr-continue-sub">אחרון: 82% דיוק · לפני 3 ימים</div></div>' +
      '<div style="color:var(--dim)">›</div>' +
      '</div>';
  }

  // ===================== TRAIN =====================
  function buildTrain() {
    var filters = ['הכול', 'עד 5 דק׳', 'מתחיל', 'מתקדם'];
    var filtersHtml = filters.map(function (f, i) { return '<div class="pr-chip' + (i === 0 ? ' active' : '') + '">' + f + '</div>'; }).join('');
    var modesHtml = TRAIN_MODES.map(function (m) {
      return '<div class="pr-card pr-mode-card" data-action="go" data-screen="' + m.screen + '">' +
        '<div class="pr-mode-icon" style="background:' + m.iconBg + '">' + m.icon + '</div>' +
        '<div class="pr-mode-name">' + m.name + '</div>' +
        '<div class="pr-mode-desc">' + m.desc + '</div>' +
        '<div class="pr-mode-meta"><span>' + m.level + '</span><span>' + m.last + '</span></div>' +
        '</div>';
    }).join('');
    var programHtml = PRO_PROGRAM.map(function (p) {
      return '<div class="pr-card pr-program-card">' +
        '<div class="pr-program-top"><div class="pr-program-range">' + p.range + '</div><div class="pr-program-level">' + p.level + '</div></div>' +
        '<div class="pr-program-desc">' + p.desc + '</div>' +
        '<div class="pr-progress-row"><div class="pr-progress-track"><div class="pr-progress-fill" style="width:' + p.pct + '%"></div></div><div class="pr-progress-frac">' + p.label + '</div></div>' +
        '</div>';
    }).join('');
    return '' +
      '<div class="pr-page-title">אימון</div>' +
      '<div class="pr-filters">' + filtersHtml + '</div>' +
      '<div class="pr-modes-grid">' + modesHtml + '</div>' +
      '<div class="pr-program-title">תוכנית PRO · 12 אימונים</div>' +
      '<div class="pr-program-sub">גרף התקדמות קבוע בשלושה שלבים.</div>' +
      '<div class="pr-program-list">' + programHtml + '</div>';
  }

  // ===================== DRILL =====================
  function buildDrill() {
    var scen = scenarios()[state.dScenario];
    var win = DRILL_WINDOW_MS;
    var timerPct = state.dPhase === 'running' ? Math.max(0, (state.dTimeLeft / win) * 100) : (state.dPhase === 'idle' ? 100 : 0);
    var timerSeconds = state.dPhase === 'running' ? (state.dTimeLeft / 1000).toFixed(1) : (win / 1000).toFixed(1);
    var timerColor = timerPct > 50 ? 'var(--accent)' : (timerPct > 25 ? '#E0A93A' : '#E05555');
    var oppNear = state.dOppNear;
    var oppLeft = state.dPhase === 'running' ? (oppNear ? 52 : 78) : 78;
    var oppTop = state.dPhase === 'running' ? (oppNear ? 44 : 14) : 14;

    var optsHtml = scen.opts.map(function (o, i) {
      var opacity = 1;
      if (state.dPhase === 'result' && state.dResult && !state.dResult.timeout) {
        opacity = (o.ok || state.dResult.pick === i) ? 1 : 0.4;
      }
      return '<button class="pr-decision-btn" style="opacity:' + opacity + '" data-action="pick" data-i="' + i + '"><span class="key">' + o.key + '</span>' + o.label + '</button>';
    }).join('');

    var overlayHtml = '';
    if (state.dPhase === 'idle') {
      overlayHtml = '<div class="pr-overlay pr-overlay-idle"><h3>קרא את הלחץ. החלט מהר.</h3><p>יריב מתקרב. בחר את האפשרות הנכונה לפני שהזמן נגמר.</p><button class="pr-btn pr-btn-primary" data-action="startDrill">התחל תרגיל</button></div>';
    } else if (state.dPhase === 'result') {
      var r = state.dResult;
      var icon, title, explain, bg;
      if (r.timeout) { icon = '✗'; title = 'איטי מדי'; explain = 'הלחץ הגיע לפני שהחלטת. סרוק מוקדם יותר כדי שהתמונה תהיה מוכנה כשהכדור מגיע.'; bg = 'rgba(224,85,85,.92)'; }
      else if (r.ok) { icon = '✓'; title = 'החלטה טובה'; explain = scen.why['true']; bg = 'rgba(76,175,112,.94)'; }
      else { icon = '✗'; title = 'לא האפשרות הטובה ביותר'; explain = scen.why['false']; bg = 'rgba(224,85,85,.92)'; }
      var nextLabel = state.dRep >= 8 ? 'סיים סשן' : 'חזרה הבאה';
      overlayHtml = '<div class="pr-overlay pr-overlay-result" style="background:' + bg + '">' +
        '<div class="icon">' + icon + '</div><div class="title">' + title + '</div><div class="explain">' + explain + '</div>' +
        '<div class="decision-time">החלטה · ' + state.dDecTime + 'ש\'</div>' +
        '<button data-action="nextRep">' + nextLabel + '</button></div>';
    }

    return '' +
      '<div class="pr-mini-top">' +
      '<div class="pr-mini-back" data-action="go" data-screen="train">›</div>' +
      '<div class="pr-mini-title">תרגיל לחץ</div>' +
      (state.dStreak > 0 ? '<div class="pr-mini-badge">×' + state.dStreak + '</div>' : '<div class="pr-mini-spacer"></div>') +
      '</div>' +
      '<div class="pr-timer-track"><div class="pr-timer-fill" style="width:' + timerPct + '%;background:' + timerColor + '"></div></div>' +
      '<div class="pr-mini-caption">חזרה ' + state.dRep + ' / 8 · ' + timerSeconds + 'ש\'</div>' +
      '<div class="pr-pitch">' +
      '<div class="pr-pitch-lines-a"></div><div class="pr-pitch-lines-b"></div><div class="pr-pitch-lines-c"></div><div class="pr-pitch-mid"></div>' +
      '<div class="pr-dot pr-teammate"></div>' +
      '<div class="pr-dot pr-keeper"></div><div class="pr-keeper-label">שוער</div>' +
      '<div class="pr-dot pr-you"></div><div class="pr-you-label">אתה</div>' +
      '<div class="pr-dot pr-opponent" style="left:' + oppLeft + '%;top:' + oppTop + '%"></div>' +
      overlayHtml +
      '</div>' +
      '<div class="pr-decision-list">' + optsHtml + '</div>';
  }

  function startDrill() {
    clearInterval(timers.drill);
    var win = DRILL_WINDOW_MS;
    var scenIdx = Math.floor(Math.random() * scenarios().length);
    state.dPhase = 'running'; state.dTimeLeft = win; state.dScenario = scenIdx; state.dResult = null; state.dOppNear = false;
    render();
    requestAnimationFrame(function () { state.dOppNear = true; render(); });
    var start = Date.now();
    timers.drill = setInterval(function () {
      var left = win - (Date.now() - start);
      if (left <= 0) { clearInterval(timers.drill); drillTimeout(); }
      else { state.dTimeLeft = left; render(); }
    }, 50);
  }
  function drillTimeout() {
    state.dPhase = 'result'; state.dResult = { ok: false, timeout: true }; state.dStreak = 0; state.dDecTime = (DRILL_WINDOW_MS / 1000).toFixed(2);
    render();
  }
  function pickOption(i) {
    if (state.dPhase !== 'running') return;
    clearInterval(timers.drill);
    var win = DRILL_WINDOW_MS;
    var scen = scenarios()[state.dScenario];
    var ok = scen.opts[i].ok;
    var dec = ((win - state.dTimeLeft) / 1000).toFixed(2);
    state.dPhase = 'result'; state.dResult = { ok: ok, pick: i }; state.dStreak = ok ? state.dStreak + 1 : 0; state.dDecTime = dec;
    render();
  }
  function nextRep() {
    if (state.dRep >= 8) { state.dPhase = 'idle'; state.dRep = 1; render(); return; }
    state.dRep = state.dRep + 1;
    startDrill();
  }

  // ===================== SCAN =====================
  function buildScan() {
    var scanPct = ((state.sRep - 1) / 6) * 100 + (state.sPhase === 'result' ? (100 / 6) : 0);
    var question = state.sQType === 0 ? 'כמה נקודות אדומות ראית?' : 'מאיזה צד היה השחקן החופשי (כחול)?';
    var correct = state.sQType === 0 ? String(state.sRed) : ({ Left: 'שמאל', Right: 'ימין' }[state.sFreeSide]);

    var overlay = '';
    if (state.sPhase === 'idle') {
      overlay = '<div class="pr-overlay"><div class="pr-scan-ring">◎</div><h3 style="font-size:17px;font-weight:800;margin-top:16px">סרוק לפני שאתה מקבל</h3><p style="font-size:13px;color:var(--dim);margin-top:8px;max-width:240px">נקודות מבזיקות לרגע. אחר כך ענה מה ראית.</p><button class="pr-btn pr-btn-primary" data-action="startScan">התחל</button></div>';
    } else if (state.sPhase === 'flash') {
      var dotsHtml = state.sDots.map(function (d) {
        return '<div class="pr-dot" style="top:' + d.top + '%;left:' + d.left + '%;width:18px;height:18px;background:' + d.color + ';animation:prFlash .85s ease forwards;box-shadow:0 0 12px ' + d.color + '"></div>';
      }).join('');
      overlay = '<div style="position:absolute;inset:0"><div class="pr-scan-flash-label">סרוק את השוליים…</div>' + dotsHtml + '</div>';
    } else if (state.sPhase === 'ask') {
      var answersHtml;
      if (state.sQType === 0) {
        answersHtml = [1, 2, 3, 4].map(function (n) { return '<button data-action="answerScan" data-val="' + n + '">' + n + '</button>'; }).join('');
      } else {
        answersHtml = [['Left', 'שמאל'], ['Right', 'ימין']].map(function (s) { return '<button data-action="answerScan" data-val="' + s[0] + '">' + s[1] + '</button>'; }).join('');
      }
      overlay = '<div class="pr-overlay"><div style="font-size:18px;font-weight:800;max-width:250px">' + question + '</div><div class="pr-scan-answers">' + answersHtml + '</div></div>';
    } else if (state.sPhase === 'result') {
      var ok = state.sAnswered && state.sAnswered.ok;
      var icon = ok ? '✓' : '✗', title = ok ? 'עין חדה' : 'פספסת', bg = ok ? 'rgba(76,175,112,.94)' : 'rgba(224,85,85,.92)';
      var nextLabel = state.sRep >= 6 ? 'סיים' : 'הבא';
      overlay = '<div class="pr-overlay pr-overlay-result" style="background:' + bg + '"><div class="icon">' + icon + '</div><div class="title">' + title + '</div><div style="font-size:13px;color:rgba(255,255,255,.85);margin-top:10px">התשובה הנכונה: ' + correct + '</div><button data-action="nextScan">' + nextLabel + '</button></div>';
    }

    return '' +
      '<div class="pr-mini-top"><div class="pr-mini-back" data-action="go" data-screen="train">›</div><div class="pr-mini-title">סריקה</div><div class="pr-mini-spacer"></div></div>' +
      '<div class="pr-timer-track"><div class="pr-timer-fill" style="width:' + scanPct + '%;background:var(--accent);transition:width .3s ease"></div></div>' +
      '<div class="pr-mini-caption">חזרה ' + state.sRep + ' / 6</div>' +
      '<div class="pr-pitch">' + overlay + '</div>';
  }

  function startScan() {
    var red = 1 + Math.floor(Math.random() * 4);
    var total = red + 2 + Math.floor(Math.random() * 3);
    var dots = [];
    var edges = [
      function () { return { top: 4 + Math.random() * 8, left: 8 + Math.random() * 84 }; },
      function () { return { top: 88 + Math.random() * 8, left: 8 + Math.random() * 84 }; },
      function () { return { top: 8 + Math.random() * 84, left: 3 + Math.random() * 7 }; },
      function () { return { top: 8 + Math.random() * 84, left: 90 + Math.random() * 7 }; }
    ];
    for (var i = 0; i < total; i++) {
      var p = edges[Math.floor(Math.random() * 4)]();
      dots.push({ top: p.top, left: p.left, color: i < red ? '#E05555' : (i < red + 2 ? '#4CAF70' : '#2E5FD8') });
    }
    var freeSide = Math.random() > 0.5 ? 'Left' : 'Right';
    var qType = Math.random() > 0.5 ? 0 : 1;
    state.sPhase = 'flash'; state.sDots = dots; state.sRed = red; state.sFreeSide = freeSide; state.sAnswered = null; state.sQType = qType;
    render();
    clearTimeout(timers.scan);
    timers.scan = setTimeout(function () { state.sPhase = 'ask'; render(); }, 850);
  }
  function answerScan(val) {
    var correct = state.sQType === 0 ? state.sRed : state.sFreeSide;
    var ok = String(val) === String(correct);
    state.sPhase = 'result'; state.sAnswered = { val: val, ok: ok };
    render();
  }
  function nextScan() {
    if (state.sRep >= 6) { state.sPhase = 'idle'; state.sRep = 1; render(); return; }
    state.sRep = state.sRep + 1;
    startScan();
  }

  // ===================== DOUBLE SCAN =====================
  function buildDoubleScan() {
    var phase = state.ds2Phase;
    var flashHex = { blue: '#2E5FD8', yellow: '#E0C93A' };
    var flashColor = flashHex[state.ds2Color1] || '#000';
    var bg = (phase === 'count' || phase === 'flash') ? '#000' : 'var(--bg)';
    var headerColor = (phase === 'count' || phase === 'flash') ? '#fff' : 'var(--ink)';
    var repLabel = 'חזרה ' + (state.ds2Rep || 1) + ' / 10';

    var body = '';
    if (phase === 'idle') {
      body = '<div class="pr-overlay" style="flex:1">' +
        '<div class="pr-scan-ring">⇄</div>' +
        '<h3 style="font-size:18px;font-weight:800;max-width:260px;margin-top:16px">סרוק. קרא את הצבע. פתח.</h3>' +
        '<p style="font-size:13px;color:var(--dim);margin-top:10px;max-width:270px;line-height:1.6">ספירה לאחור, ואז צבע יופיע על המסך למשך 5 שניות. קרא אותו מהר ובחר בראש את כיוון הפתיחה — ואז חוזרים על זה בסשן הבא.</p>' +
        '<div class="pr-ds-legend"><span style="color:#2E5FD8">⬤ כחול = ימין</span><span style="color:#E0C93A">⬤ צהוב = שמאל</span></div>' +
        '<button class="pr-btn pr-btn-primary" data-action="startDS">התחל</button>' +
        '</div>';
    } else if (phase === 'count') {
      body = '<div class="pr-ds-count"><div class="pr-ds-count-num">' + state.ds2Count + '</div></div>';
    } else if (phase === 'flash') {
      body = '<div class="pr-ds-flash" style="background:' + flashColor + '"><div class="pr-ds-flash-sec">' + state.ds2FlashSec.toFixed(1) + 'ש\'</div></div>';
    } else if (phase === 'done') {
      body = '<div class="pr-overlay" style="flex:1">' +
        '<div style="font-size:44px">✓</div><div style="font-size:20px;font-weight:800;margin-top:14px">הסשן הושלם</div>' +
        '<p style="font-size:13px;color:var(--dim);margin-top:8px;max-width:250px;line-height:1.5">10 חזרות של סריקה ופתיחה תחת זמן.</p>' +
        '<button class="pr-btn pr-btn-primary" data-action="startDS">סשן נוסף</button>' +
        '</div>';
    }

    return '<div style="position:absolute;inset:0;background:' + bg + ';display:flex;flex-direction:column">' +
      '<div class="pr-mini-top"><div class="pr-mini-back" data-action="go" data-screen="train" style="color:' + headerColor + '">›</div>' +
      '<div class="pr-mini-title" style="color:' + headerColor + '">סריקה כפולה · פס עומק</div>' +
      '<div class="pr-mini-badge" style="color:' + headerColor + '">' + repLabel + '</div></div>' +
      body +
      '</div>';
  }

  function startDS() {
    clearTimeout(timers.ds);
    state.ds2Phase = 'count'; state.ds2Count = 3; state.ds2Rep = 1;
    render();
    tickCountDS(3);
  }
  function tickCountDS(n) {
    timers.ds = setTimeout(function () {
      if (n <= 1) {
        var color = Math.random() > 0.5 ? 'blue' : 'yellow';
        state.ds2Phase = 'flash'; state.ds2Color1 = color; state.ds2FlashSec = 1.5;
        render();
        tickFlashDS(1.5);
      } else {
        state.ds2Count = n - 1;
        render();
        tickCountDS(n - 1);
      }
    }, 1000);
  }
  function tickFlashDS(sec) {
    timers.ds = setTimeout(function () {
      var next = Math.round((sec - 0.1) * 10) / 10;
      if (next <= 0) {
        if (state.ds2Rep >= 10) { state.ds2Phase = 'done'; render(); return; }
        state.ds2Rep = state.ds2Rep + 1; state.ds2Phase = 'count'; state.ds2Count = 3;
        render();
        tickCountDS(3);
      } else {
        state.ds2FlashSec = next;
        render();
        tickFlashDS(next);
      }
    }, 100);
  }

  // ===================== PROGRESS =====================
  function buildProgress() {
    var data = RANGE_DATA[state.range];
    var W = 300, H = 100, n = data.length;
    var mx = Math.max.apply(null, data), mn = Math.min.apply(null, data), rng = (mx - mn) || 1;
    var pts = data.map(function (v, i) { return { x: (i / (n - 1)) * W, y: 10 + (1 - (v - mn) / rng) * (H - 10) }; });
    var linePath = pts.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
    var lineArea = '0,' + H + ' ' + linePath + ' ' + W + ',' + H;
    var dotsHtml = pts.map(function (p) { return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="3" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"></circle>'; }).join('');
    var rangeTabsHtml = [['7d', '7 י׳'], ['30d', '30 י׳'], ['all', 'הכול']].map(function (t) {
      return '<div class="pr-range-tab' + (state.range === t[0] ? ' active' : '') + '" data-action="setRange" data-range="' + t[0] + '">' + t[1] + '</div>';
    }).join('');

    var cx = 100, cy = 100, R = 78;
    function pt(val, i) { var ang = -Math.PI / 2 + i * (2 * Math.PI / 5); var r = R * (val / 100); return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)]; }
    var radarShape = RADAR_AXES.map(function (a, i) { var p = pt(a[1], i); return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    var ringsHtml = [0.33, 0.66, 1].map(function (f) {
      var poly = RADAR_AXES.map(function (a, i) { var p = pt(100 * f, i); return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
      return '<polygon points="' + poly + '" fill="none" stroke="var(--line)" stroke-width="1"></polygon>';
    }).join('');
    var spokesHtml = RADAR_AXES.map(function (a, i) { var p = pt(100, i); return '<line x1="100" y1="100" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="var(--line)" stroke-width="1"></line>'; }).join('');
    var legendHtml = RADAR_AXES.map(function (a) {
      var color = a[1] < 60 ? '#E05555' : (a[1] < 75 ? '#E0A93A' : '#4CAF70');
      return '<div class="pr-radar-legend-row"><span class="name">' + a[0] + '</span><span class="value" style="color:' + color + '">' + a[1] + '</span></div>';
    }).join('');

    var wmax = Math.max.apply(null, WEEK_BARS_DATA);
    var barsHtml = WEEK_BARS_DATA.map(function (v, i) {
      var h = (v / wmax) * 100;
      var color = i === WEEK_BARS_DATA.length - 1 ? 'var(--accent)' : 'var(--navy)';
      return '<div class="pr-week-bar-col"><div class="pr-week-bar" style="height:' + h + '%;background:' + color + '"></div><div class="pr-week-bar-label">ש' + (i + 1) + '</div></div>';
    }).join('');

    var sessionsHtml = RECENT_SESSIONS.map(function (r) {
      return '<div class="pr-card pr-session-row"><div class="pr-session-icon">' + r.icon + '</div>' +
        '<div style="flex:1"><div class="pr-session-name">' + r.name + '</div><div class="pr-session-when">' + r.when + '</div></div>' +
        '<div class="pr-session-score" style="color:' + (r.good ? '#4CAF70' : '#E0A93A') + '">' + r.score + '</div></div>';
    }).join('');

    return '' +
      '<div class="pr-page-title">התקדמות</div>' +
      '<div class="pr-card" style="margin-top:16px;padding:16px">' +
      '<div class="pr-progress-card-top"><div style="font-size:13px;font-weight:700">זמן החלטה ממוצע</div><div class="pr-range-tabs">' + rangeTabsHtml + '</div></div>' +
      '<div class="pr-reaction-value"><div class="num">1.42<span class="unit">s</span></div><div class="pr-reaction-delta">▼ 0.3ש\' השבוע</div></div>' +
      '<svg viewBox="0 0 300 110" style="width:100%;height:110px;margin-top:8px;overflow:visible">' +
      '<polyline points="' + linePath + '" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>' +
      '<polygon points="' + lineArea + '" fill="var(--accent)" opacity="0.08"></polygon>' +
      dotsHtml +
      '</svg>' +
      '</div>' +
      '<div class="pr-card" style="margin-top:14px;padding:16px">' +
      '<div style="font-size:13px;font-weight:700">מכ״ם חולשות</div>' +
      '<div class="pr-radar-row"><svg viewBox="0 0 200 200" style="width:150px;height:150px;flex:none">' + ringsHtml + spokesHtml +
      '<polygon points="' + radarShape + '" fill="var(--accent)" opacity="0.22" stroke="var(--accent)" stroke-width="2"></polygon></svg>' +
      '<div class="pr-radar-legend">' + legendHtml + '</div></div>' +
      '</div>' +
      '<div class="pr-card" style="margin-top:14px;padding:16px">' +
      '<div style="font-size:13px;font-weight:700">סשנים · 8 שבועות אחרונים</div>' +
      '<div class="pr-week-bars">' + barsHtml + '</div>' +
      '</div>' +
      '<div class="pr-section-label" style="margin-top:20px">סשנים אחרונים</div>' +
      '<div class="pr-session-list">' + sessionsHtml + '</div>';
  }

  // ===================== PROFILE =====================
  function buildProfile() {
    var p = state.profile || {};
    var fullName = ((p.first_name || '') + (p.last_name ? ' ' + p.last_name : '')).trim() || 'שחקן';
    var team = p.team || 'הקבוצה שלי';
    var role = state.role;
    var initials = fullName.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();

    var badgesHtml = BADGES.map(function (b) {
      return '<div class="pr-badge"><div class="pr-badge-icon" style="background:color-mix(in srgb, ' + b.color + ' 14%, var(--surface));color:' + b.color + '">' + b.icon + '</div><div class="pr-badge-name">' + b.name + '</div></div>';
    }).join('');

    var settingsRows = [
      { icon: '🔔', label: 'התראות', right: 'פעיל' },
      { icon: '▚', label: 'שינוי תפקיד', right: ROLE_LABELS[role] },
      { icon: '🔒', label: 'שינוי סיסמה', right: '' },
      { icon: '⏻', label: 'התנתקות', right: '', action: 'logout', danger: true }
    ];
    var settingsHtml = settingsRows.map(function (s) {
      return '<div class="pr-settings-row"' + (s.action ? ' data-action="' + s.action + '"' : '') + '>' +
        '<span class="pr-settings-icon">' + s.icon + '</span>' +
        '<span class="pr-settings-label" style="' + (s.danger ? 'color:#E05555' : '') + '">' + s.label + '</span>' +
        '<span class="pr-settings-right">' + s.right + '</span>' +
        '</div>';
    }).join('');

    var themeSwatches = ['cream', 'dark', 'hybrid'].map(function (t) {
      return '<div class="pr-theme-swatch' + (state.theme === t ? ' active' : '') + '" data-action="setTheme" data-theme="' + t + '">' + THEME_LABELS[t] + '</div>';
    }).join('');

    return '' +
      '<div class="pr-profile-header"><div class="pr-avatar">' + initials + '</div>' +
      '<div><div class="pr-profile-name">' + esc(fullName) + '</div><div class="pr-profile-team">' + esc(team) + '</div>' +
      '<div class="pr-profile-role-pill">' + ROLE_LABELS[role] + '</div></div></div>' +
      '<div class="pr-profile-stats">' +
      '<div class="pr-card pr-profile-stat"><div class="num">' + (p.total_hours || 0) + '<span class="unit">ש\'</span></div><div class="label">אימון כולל</div></div>' +
      '<div class="pr-card pr-profile-stat"><div class="num">' + (p.drills_completed || 0) + '</div><div class="label">תרגילים שהושלמו</div></div>' +
      '</div>' +
      '<div class="pr-section-label">הישגים</div>' +
      '<div class="pr-badges">' + badgesHtml + '</div>' +
      '<div class="pr-section-label">מראה</div>' +
      '<div class="pr-card"><div class="pr-theme-swatches" style="padding-top:15px">' + themeSwatches + '</div></div>' +
      '<div class="pr-section-label">הגדרות</div>' +
      '<div class="pr-card pr-settings-list">' + settingsHtml + '</div>';
  }

  function setTheme(theme) {
    state.theme = theme;
    applyTheme(theme);
    if (state.profile) state.profile.theme = theme;
    render();
    if (sb && state.userId) { sb.from('profiles').update({ theme: theme }).eq('id', state.userId).then(function () {}); }
  }

  function logout() {
    clearTimers();
    if (sb) sb.auth.signOut();
    state.userId = null; state.profile = null; state.profileExists = false; state.role = 'CB'; state.theme = 'cream'; state.calSel = [1, 1, 1];
    applyTheme('cream');
    el.loginEmail.value = ''; el.loginPassword.value = '';
    beginSplash();
  }

  // ===================== BOTTOM NAV =====================
  function buildBottomNav() {
    var navDef = [{ id: 'home', label: 'בית', icon: '⌂' }, { id: 'train', label: 'אימון', icon: '◎' }, { id: 'progress', label: 'התקדמות', icon: '▤' }, { id: 'profile', label: 'פרופיל', icon: '◑' }];
    var activeMap = { home: 'home', train: 'train', drill: 'train', scan: 'train', doublescan: 'train', progress: 'progress', profile: 'profile' };
    var activeColor = state.theme === 'hybrid' ? '#fff' : 'var(--accent)';
    var idleColor = state.theme === 'hybrid' ? 'rgba(255,255,255,.55)' : 'var(--dim)';
    return navDef.map(function (n) {
      var active = activeMap[state.screen] === n.id;
      var color = active ? activeColor : idleColor;
      return '<button class="pr-nav-item" data-action="go" data-screen="' + n.id + '" style="color:' + color + '">' +
        '<div class="pr-nav-icon">' + n.icon + '</div><div class="pr-nav-label">' + n.label + '</div></button>';
    }).join('');
  }

  // ===================== DELEGATED CLICK HANDLER =====================
  function onContentClick(e) {
    var target = e.target.closest('[data-action]');
    if (!target) return;
    var action = target.getAttribute('data-action');
    switch (action) {
      case 'go': goScreen(target.getAttribute('data-screen')); break;
      case 'pickRole': state.role = target.getAttribute('data-role'); renderOnboarding(); break;
      case 'pickCal': {
        var qi = Number(target.getAttribute('data-q')), oi = Number(target.getAttribute('data-i'));
        state.calSel[qi] = oi; renderOnboarding();
        break;
      }
      case 'finishOnboarding': finishOnboarding(); break;
      case 'startDrill': startDrill(); break;
      case 'pick': pickOption(Number(target.getAttribute('data-i'))); break;
      case 'nextRep': nextRep(); break;
      case 'startScan': startScan(); break;
      case 'answerScan': answerScan(target.getAttribute('data-val')); break;
      case 'nextScan': nextScan(); break;
      case 'startDS': startDS(); break;
      case 'setRange': state.range = target.getAttribute('data-range'); render(); break;
      case 'setTheme': setTheme(target.getAttribute('data-theme')); break;
      case 'logout': logout(); break;
    }
  }

  // ===================== AUTH =====================
  function showRegErr(msg) {
    el.registerSubmit.disabled = false;
    el.registerError.textContent = msg;
    el.registerError.style.display = 'block';
  }

  function submitLogin() {
    el.loginError.style.display = 'none';
    if (!CONFIGURED) { el.loginError.textContent = 'צריך לחבר את Supabase — מלא את config.js.'; el.loginError.style.display = 'block'; return; }
    var email = el.loginEmail.value.trim().toLowerCase();
    var password = el.loginPassword.value;
    if (!email || !password) return;
    el.loginSubmit.disabled = true;
    sb.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
      el.loginSubmit.disabled = false;
      if (res.error) { el.loginError.textContent = 'אימייל או סיסמה שגויים.'; el.loginError.style.display = 'block'; return; }
      el.loginEmail.value = ''; el.loginPassword.value = '';
      onLoggedIn(res.data.session);
    });
  }

  function submitRegister() {
    el.registerError.style.display = 'none';
    if (!CONFIGURED) { el.registerError.textContent = 'צריך לחבר את Supabase — מלא את config.js.'; el.registerError.style.display = 'block'; return; }
    var firstName = el.regFirstName.value.trim();
    var email = el.regEmail.value.trim().toLowerCase();
    var password = el.regPassword.value;
    var confirm = el.regConfirm.value;
    var team = el.regTeam.value.trim() || 'הקבוצה שלי';
    if (!firstName) { showRegErr('הכנס שם פרטי.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showRegErr('כתובת אימייל לא תקינה.'); return; }
    if (password.length < 4) { showRegErr('הסיסמה חייבת להכיל לפחות 4 תווים.'); return; }
    if (password !== confirm) { showRegErr('הסיסמאות אינן תואמות.'); return; }
    el.registerSubmit.disabled = true;
    sb.auth.signUp({ email: email, password: password }).then(function (res) {
      if (res.error) {
        var msg = /registered/i.test(res.error.message) ? 'כבר קיים חשבון עם האימייל הזה. התחבר במקום.' : res.error.message;
        showRegErr(msg);
        return;
      }
      var session = res.data.session;
      var user = res.data.user;
      if (!session) {
        el.registerSubmit.disabled = false;
        el.registerError.textContent = 'נשלח מייל אישור — אשר ואז התחבר.';
        el.registerError.style.display = 'block';
        goScreen('login');
        return;
      }
      var profileRow = { id: user.id, first_name: firstName, last_name: '', team: team, role: 'CB', theme: 'cream', streak_days: 1, total_hours: 0, drills_completed: 0 };
      sb.from('profiles').insert(profileRow).then(function (insRes) {
        el.registerSubmit.disabled = false;
        if (insRes.error) { showRegErr(insRes.error.message); return; }
        state.userId = user.id;
        state.profile = profileRow;
        state.profileExists = true;
        state.role = 'CB';
        state.theme = 'cream';
        applyTheme('cream');
        el.regPassword.value = ''; el.regConfirm.value = '';
        goScreen('onboarding');
      });
    });
  }

  function onLoggedIn(session) {
    state.userId = session.user.id;
    sb.from('profiles').select('*').eq('id', state.userId).maybeSingle().then(function (res) {
      var row = res.data;
      if (row) {
        state.profile = row;
        state.profileExists = true;
        state.role = row.role || 'CB';
        state.theme = row.theme || 'cream';
        applyTheme(state.theme);
        goScreen(row.approved ? 'home' : 'waiting');
      } else {
        state.profile = { first_name: '', last_name: '', team: '', role: 'CB', theme: 'cream', streak_days: 1, total_hours: 0, drills_completed: 0 };
        state.profileExists = false;
        applyTheme('cream');
        goScreen('onboarding');
      }
    });
  }

  function beginSplash() {
    goScreen('splash');
    var t = setTimeout(function () { goScreen('login'); }, 2000);
    el.splashLoginBtn.onclick = function () { clearTimeout(t); goScreen('login'); };
  }

  function showSetupNotice() {
    el.setupNotice.style.display = 'block';
    el.setupNotice.textContent = 'צריך לחבר את Supabase — מלא את config.js עם ה-URL וה-anon key מהפרויקט שלך, ואז רענן.';
    goScreen('login');
  }

  // ===================== INIT =====================
  function cacheEls() {
    ['app', 'splashScreen', 'splashLoginBtn', 'loginScreen', 'loginEmail', 'loginPassword', 'loginError', 'loginSubmit', 'goRegister',
      'registerScreen', 'regFirstName', 'regEmail', 'regPassword', 'regConfirm', 'regTeam', 'registerError', 'registerSubmit', 'goLogin',
      'onboardingScreen', 'waitingScreen', 'waitingRecheck', 'waitingLogout', 'mainApp', 'statusBar', 'screenContent', 'bottomNav', 'setupNotice'].forEach(function (id) { el[id] = q(id); });
  }

  function wireStaticHandlers() {
    el.goRegister.addEventListener('click', function () { goScreen('register'); });
    el.goLogin.addEventListener('click', function () { goScreen('login'); });
    el.loginSubmit.addEventListener('click', submitLogin);
    el.registerSubmit.addEventListener('click', submitRegister);
    el.loginPassword.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitLogin(); });
    el.regConfirm.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitRegister(); });
    el.waitingRecheck.addEventListener('click', recheckApproval);
    el.waitingLogout.addEventListener('click', logout);
    el.onboardingScreen.addEventListener('click', onContentClick);
    // Keep the onboarding name/team inputs in sync with state so a re-render
    // (e.g. picking a role) doesn't wipe what the user typed.
    el.onboardingScreen.addEventListener('input', function (e) {
      if (!state.profile) return;
      if (e.target.id === 'onbName') state.profile.first_name = e.target.value;
      if (e.target.id === 'onbTeam') state.profile.team = e.target.value;
    });
    el.screenContent.addEventListener('click', onContentClick);
    el.bottomNav.addEventListener('click', onContentClick);
  }

  document.addEventListener('DOMContentLoaded', function () {
    cacheEls();
    wireStaticHandlers();
    applyTheme('cream');

    if (!CONFIGURED) { showSetupNotice(); return; }

    goScreen('splash');
    var splashDone = new Promise(function (resolve) {
      var t = setTimeout(resolve, 2000);
      el.splashLoginBtn.onclick = function () { clearTimeout(t); resolve(); };
    });
    var sessionCheck = sb.auth.getSession();

    Promise.all([splashDone, sessionCheck]).then(function (results) {
      var sessionRes = results[1];
      var session = sessionRes.data && sessionRes.data.session;
      if (session) { onLoggedIn(session); } else { goScreen('login'); }
    });
  });
})();
