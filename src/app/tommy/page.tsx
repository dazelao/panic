'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/AuthLayout';

const REGULATION = `Назва: Donetsk1y FC25 league Season 1\nОсновний турнір\nЕтап 1: Швейцарська система\nКількість учасників не обмежена\nУсі матчі ВО1 (один поєдинок)\nНічийних результатів бути не може\nПроходять 128 гравці з найкращими показниками\nПорядок сортування:\n1.Очки\n2.Бухгольц \n3.Різниця м'ячів\n4.Забиті м'ячі\n5.Пропущені м'ячі (менше = краще)\nУ випадку рівності всіх показників, додатковий особистий плейраунд\nТі, хто не пройшов, потрапляють до другого турніру автоматично, відміна реєстрації за бажанням\nЕтап 2: Плей-офф Швейцарки ака Турнір \"Рексів\" \nПарна Single elimination сітка \"на вильот\" (кількість \"прохідних\" міст буде відома після закінчення реєстрації та розуміння загальної кількості учасників) \nПосів: сильний-слабий після швейцарки (Формат ЛЧ)\nВсі матчі ВО2\nУ турнірах нічийних результатів бути не може (граємо 2 матчі і рахуємо різницю голів)\nЯкщо різниця голів рівна, одразу серія пенальті\n1/64, 1/32, 1/16, 1/8, 1/4, 1/2 фіналу, матч за 3-тє місце, фінал\nДругий турнір \"Роботяг\" (для тих, хто не потрапив в турнір \"Рексів\")\nЕтап 2: Плей-офф\nSingle elimination сітка , автоматична реєстрація після першого етапу. \nВсі матчі ВО2, без нічиїх\nУ турнірах нічийних результатів бути не може (граємо 2 матчі і рахуємо різницю голів)\nЯкщо різниця голів рівна, одразу серія пенальті\n1/128, 1/64, 1/32, 1/16, 1/8, 1/4, 1/2 фіналу, матч за 3-тє місце, фінал\nУ випадку непарної кількості учасників, буде відбуватись \"автоматичне доокруглення сітки\" для першого раунду стадії плей-офф\nТехнічні вимоги\nТой, хто грає вдома першим, вимірюється монетою, учасники самі списуються один з одним, та кидають жереб (як приклад кубік в телеграмі), отримати інформацію за суперником можна скопіювавши його дані натисканням на нік в блоці учасників\nНалаштування матчу: Класична товарка, оренди не дозволені\nДозволяється використовувати карти до 95 рейтингу включно\nДозволяється використовувати в складі 1 легенду та 1 героя (до 95 рейтингу включно)\nВимоги по складу не розповсюджуються на воротарів (можна використовувати будь якого статусу або рейтингу)\nСтадіон UT Champions\nГазон Класичний\nЧасові рамки\nОсновний турнір:\nШвейцарка: кінцева кількість раундів визначиться після закриття реєстрації. Час проведення матчів визначається за особистою домовленістю гравців в період з 00-00 до 23-59 в день проведення туру (всі оголошення про старт раундів будуть доступні на сайті турніру та в ТГ-групі https://t.me/eafc_ua ) \nу випадку не зіграного матчу поразка призначається тому, через кого гра не відбулася. Якщо гра не відбулася через форс-мажор (визначається на розсуд адміністрації турніру), призначається додаткова дата проведення матчу, але обов'язково до початку наступного раунду швейцарки. \nПлей-офф: інформація по часових рамках Плей-офф буде оновлена після закриття реєстрації та розуміння загальної кількості учасників.\nТурнір \"Роботяг\":\nПлей-офф:  інформація по часових рамках та кількості раундів в турнірі для тих, хто не пройшов в турнір \"Рексів\" буде оновлена після закриття реєстрації та розуміння загальної кількості учасників.`;

export default function TommyPage() {
  return (
    <AuthLayout>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 py-8">
        <div className="bg-white/90 p-10 rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 animate-fade-in">
          <h1 className="text-5xl font-extrabold mb-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-indigo-400 to-sky-500 drop-shadow-lg">Регламент турніру</h1>

          <div className="mb-8 text-lg">
            <span className="font-bold text-indigo-700">Назва:</span> <span className="font-semibold text-gray-800">Donetsk1y FC25 league Season 1</span>
          </div>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-indigo-800 tracking-wide">Основний турнір</h2>

            <div className="rounded-xl bg-indigo-50/80 border-l-8 border-indigo-300 p-6 mb-6 shadow-sm animate-fade-in">
              <h3 className="text-xl font-bold mb-2 text-indigo-700">Етап 1: Швейцарська система</h3>
              <ul className="custom-bullet-list mb-2 text-base text-gray-900 space-y-1">
                <li>Кількість учасників не обмежена</li>
                <li>Усі матчі <span className="font-semibold text-indigo-700">BO1</span> (один поєдинок)</li>
                <li>Нічийних результатів бути не може</li>
                <li>Проходять <span className="font-semibold text-indigo-700">128 гравці</span> з найкращими показниками</li>
                <li className="font-bold">Порядок сортування:
                  <ol className="list-decimal pl-8 font-normal mt-1 space-y-0.5">
                    <li>Очки</li>
                    <li>Бухгольц</li>
                    <li>Різниця м'ячів</li>
                    <li>Забиті м'ячі</li>
                    <li>Пропущені м'ячі <span className="text-gray-500">(менше = краще)</span></li>
                  </ol>
                </li>
                <li>У випадку рівності всіх показників, <span className="font-semibold text-indigo-700">додатковий особистий плейраунд</span></li>
                <li>Ті, хто не пройшов, потрапляють до другого турніру автоматично, <span className="italic">відміна реєстрації за бажанням</span></li>
              </ul>
            </div>

            <div className="rounded-xl bg-sky-50/80 border-l-8 border-sky-300 p-6 mb-6 shadow-sm animate-fade-in">
              <h3 className="text-xl font-bold mb-2 text-sky-700">Етап 2: Плей-офф Швейцарки ака Турнір "Рексів"</h3>
              <ul className="custom-bullet-list mb-2 text-base text-gray-900 space-y-1">
                <li>Парна <span className="font-semibold text-sky-700">Single elimination</span> сітка "на вильот" (кількість "прохідних" міст буде відома після закінчення реєстрації та розуміння загальної кількості учасників)</li>
                <li><span className="font-bold text-sky-700">Посів: сильний-слабий після швейцарки (Формат ЛЧ)</span></li>
                <li>Всі матчі <span className="font-semibold text-sky-700">BO2</span></li>
                <li>У турнірах нічийних результатів бути не може (граємо 2 матчі і рахуємо різницю голів)</li>
                <li>Якщо різниця голів рівна, одразу серія пенальті</li>
                <li className="text-gray-700">1/64, 1/32, 1/16, 1/8, 1/4, 1/2 фіналу, матч за 3-тє місце, фінал</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-amber-800 tracking-wide">Другий турнір "Роботяг" (для тих, хто не потрапив в турнір "Рексів")</h2>
            <div className="rounded-xl bg-amber-50/80 border-l-8 border-amber-300 p-6 mb-6 shadow-sm animate-fade-in">
              <h3 className="text-xl font-bold mb-2 text-amber-700">Етап 2: Плей-офф</h3>
              <ul className="custom-bullet-list mb-2 text-base text-gray-900 space-y-1">
                <li>Single elimination сітка , автоматична реєстрація після першого етапу.</li>
                <li>Всі матчі <span className="font-semibold text-amber-700">BO2</span>, без нічиїх</li>
                <li>У турнірах нічийних результатів бути не може (граємо 2 матчі і рахуємо різницю голів)</li>
                <li>Якщо різниця голів рівна, одразу серія пенальті</li>
                <li className="text-gray-700">1/128, 1/64, 1/32, 1/16, 1/8, 1/4, 1/2 фіналу, матч за 3-тє місце, фінал</li>
                <li>У випадку непарної кількості учасників, буде відбуватись "автоматичне доокруглення сітки" для першого раунду стадії плей-офф</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-emerald-800 tracking-wide">Технічні вимоги</h2>
            <div className="rounded-xl bg-emerald-50/80 border-l-8 border-emerald-300 p-6 mb-6 shadow-sm animate-fade-in">
              <ul className="custom-bullet-list mb-2 text-base text-gray-900 space-y-1">
                <li>Той, хто грає вдома першим, вимірюється монетою, учасники самі списуються один з одним, та кидають жереб (як приклад кубік в телеграмі), отримати інформацію за суперником можна скопіювавши його дані натисканням на нік в блоці учасників</li>
                <li>Налаштування матчу: Класична товарка, оренди не дозволені</li>
                <li>Дозволяється використовувати карти до 95 рейтингу включно</li>
                <li>Дозволяється використовувати в складі 1 легенду та 1 героя (до 95 рейтингу включно)</li>
                <li>Вимоги по складу не розповсюджуються на воротарів (можна використовувати будь якого статусу або рейтингу)</li>
                <li>Стадіон UT Champions</li>
                <li>Газон Класичний</li>
              </ul>
            </div>
          </section>

          <section className="mb-4">
            <h2 className="text-2xl font-bold mb-4 text-fuchsia-800 tracking-wide">Часові рамки</h2>
            <div className="rounded-xl bg-fuchsia-50/80 border-l-8 border-fuchsia-300 p-6 mb-6 shadow-sm animate-fade-in">
              <h3 className="text-lg font-bold mb-2 text-fuchsia-700">Основний турнір:</h3>
              <div className="mb-2 text-fuchsia-900 font-semibold">
                <span className="font-bold">Швейцарка:</span> кінцева кількість раундів визначиться після закриття реєстрації. Час проведення матчів визначається за особистою домовленістю гравців в період з 00-00 до 23-59 в день проведення туру (всі оголошення про старт раундів будуть доступні на сайті турніру та в ТГ-групі <a href='https://t.me/eafc_ua' className='underline text-fuchsia-700 font-bold' target='_blank'>https://t.me/eafc_ua</a> )
              </div>
              <ul className="custom-bullet-list mb-2 text-base text-fuchsia-950 font-medium space-y-1">
                <li>у випадку не зіграного матчу поразка призначається тому, через кого гра не відбулася. Якщо гра не відбулася через форс-мажор (визначається на розсуд адміністрації турніру), призначається додаткова дата проведення матчу, але обов'язково до початку наступного раунду швейцарки.</li>
              </ul>
              <div className="mb-2 text-fuchsia-700 font-semibold">
                <span className="font-bold">Плей-офф:</span> <span className="opacity-80">інформація по часових рамках Плей-офф буде оновлена після закриття реєстрації та розуміння загальної кількості учасників.</span>
              </div>

              <h3 className="text-lg font-bold mt-6 mb-2 text-fuchsia-700">Турнір "Роботяг":</h3>
              <div className="mb-2 text-fuchsia-700 font-semibold">
                <span className="font-bold">Плей-офф:</span> <span className="opacity-80">інформація по часових рамках та кількості раундів в турнірі для тих, хто не пройшов в турнір "Рексів" буде оновлена після закриття реєстрації та розуміння загальної кількості учасників.</span>
              </div>
            </div>
          </section>

          <style jsx>{`
            .custom-bullet-list li {
              position: relative;
              padding-left: 1.5em;
            }
            .custom-bullet-list li:before {
              content: '';
              position: absolute;
              left: 0.2em;
              top: 0.7em;
              width: 0.7em;
              height: 0.7em;
              background: linear-gradient(135deg, #6366f1 60%, #38bdf8 100%);
              border-radius: 50%;
              box-shadow: 0 1px 4px 0 #6366f133;
              opacity: 0.7;
            }
            .custom-bullet-list li li:before {
              background: linear-gradient(135deg, #f59e42 60%, #f472b6 100%);
              opacity: 0.5;
            }
            .animate-fade-in {
              animation: fadeIn 0.7s cubic-bezier(.4,0,.2,1);
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: none; }
            }
          `}</style>
        </div>
      </div>
    </AuthLayout>
  );
} 