'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/AuthLayout';

const DEFAULT_REGULATION = `Назва: Donetsk1y FC25 league Season 1\n\nОсновний турнір\nЕтап 1: Швейцарська система\nКількість учасників не обмежена\nУсі матчі ВО1 (один поєдинок)\nНічиїх результатів бути не може\nПроходять 128 гравці з найкращими показниками\nПорядок сортування:\n- Очки\n- Бухгольц\n- Різниця м'ячів\n- Забиті м'ячі\n- Пропущені м'ячі (менше = краще)\nУ випадку рівності всіх показників, додатковий особистий плейраунд\nТі, хто не пройшов, потрапляють до другого турніру автоматично, відміна реєстрації за бажанням\n\nЕтап 2: Плей-офф\nSingle elimination сітка на 128 гравці\nПосів: сильний-слабий після швейцарки (Формат ЛЧ)\nВсі матчі ВО2\nУ турнірах нічиїх результатів бути не може (граємо 2 матчі і рахуємо різницю голів)\nЯкщо різниця голів рівна, одразу серія пенальті\n1/64, 1/32, 1/16, 1/8, 1/4, 1/2 фіналу, матч за 3-тє місце, фінал\n\nДругий турнір (для вибулих на першому етапі)\nЕтап 2: Плей-офф\nSingle elimination сітка , автоматична реєстрація після першого етапу\nВсі матчі ВО2, без нічиїх\nУ турнірах нічиїх результатів бути не може (граємо 2 матчі і рахуємо різницю голів)\nЯкщо різниця голів рівна, одразу серія пенальті\n1/128, 1/64, 1/32, 1/16, 1/8, 1/4, 1/2 фіналу, матч за 3-тє місце, фінал\n\nТехнічні вимоги\nТой, хто грає вдома першим, вимірюється монетою, учасники самі списуються один з одним, та кидають жребій (як приклад кубік в телеграмі), отримати інформацію за суперником можна скопіювавши його дані натисканням на нік в блоці учасників\nНалаштування матчу: Класична товарка, оренди не дозволені, вартість склажу максимум 20кк\nСтадіон UT Champions\nГазон Класичний\n\nЧасові рамки\nОсновний турнір:\nШвейцарка: 8 днів, час проведення матчів за домовленістю\nякщо домовленості нема, то час проведення матчів з 18-00 до 08-00 наступного ранку\nу випадку не зіграного матчу поразка віддається тому, через кого гра не відбулася. Якщо гра не відбулася через форс-мажор, переможець обирається жеребом через сайт random.org\nПлей-офф: залежить від кількості учасників\nна 1 раунд 1 день\n\nДругий турнір:\nПлей-офф: залежить від кількості учасників\nна 1 раунд 1 день`;

function parseRegulation(text: string) {
  // Примитивный парсер plain text -> jsx секции, списки, подзаголовки
  const lines = text.split(/\r?\n/);
  const blocks: any[] = [];
  let currentList: string[] = [];
  let inList = false;

  const pushList = () => {
    if (currentList.length) {
      blocks.push(
        <ul className="list-disc pl-6 mb-2 text-gray-800">
          {currentList.map((item, i) => <li key={i}>{item.replace(/^[-•]\s*/, '')}</li>)}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      pushList();
      blocks.push(<div key={idx} className="my-2" />);
      inList = false;
      return;
    }
    if (/^[-•]/.test(trimmed)) {
      currentList.push(trimmed);
      inList = true;
      return;
    }
    if (inList) {
      pushList();
      inList = false;
    }
    // Подзаголовки
    if (/^(Назва|Основний турнір|Етап|Порядок сортування|Технічні вимоги|Часові рамки|Другий турнір|Single elimination|Посів|Налаштування матчу|Стадіон|Газон|Швейцарка)/i.test(trimmed)) {
      blocks.push(
        <div key={idx} className="font-semibold text-lg text-indigo-700 mt-4 mb-1">{trimmed}</div>
      );
      return;
    }
    // Мелкие акценты
    if (/^\d+\//.test(trimmed)) {
      blocks.push(
        <div key={idx} className="text-gray-700 ml-2">{trimmed}</div>
      );
      return;
    }
    // Обычный текст
    blocks.push(
      <div key={idx} className="text-gray-900 mb-1">{trimmed}</div>
    );
  });
  pushList();
  return blocks;
}

export default function TommyPage() {
  const { user } = useAuth();
  const [regulation, setRegulation] = useState('');
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    fetch('/api/tommy/regulation')
      .then(r => r.ok ? r.text() : Promise.resolve(DEFAULT_REGULATION))
      .then(text => {
        setRegulation(text);
        setEditValue(text);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/tommy/regulation', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: editValue,
    });
    setRegulation(editValue);
    setEditing(false);
    setSaving(false);
  };

  return (
    <AuthLayout>
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-2xl w-full border border-slate-200">
          <h1 className="text-3xl font-extrabold mb-6 text-center text-black tracking-tight">Регламент турніру</h1>
          {loading ? (
            <div className="text-gray-500">Завантаження...</div>
          ) : editing ? (
            <>
              <textarea
                className="w-full h-96 border border-gray-300 rounded p-2 mb-4 text-base text-gray-900 font-mono"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Збереження...' : 'Зберегти'}
                </button>
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  onClick={() => { setEditing(false); setEditValue(regulation); }}
                  disabled={saving}
                >
                  Відміна
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="prose prose-sm sm:prose-base max-w-none mb-4">
                {parseRegulation(regulation)}
              </div>
              {isAdmin && (
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  onClick={() => setEditing(true)}
                >
                  Редагувати
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  );
} 