'use client';

import AuthLayout from '@/components/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PlayerChip {
  id: number;
  x: number;
  y: number;
  team: 'blue' | 'yellow' | 'white';
}

interface Arrow {
  id: number;
  fromChipId: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface Zone {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: 'black' | 'purple' | 'white' | 'pending';
}

type Formation = 'default' | '3-1-4-2' | '3-4-1-2' | '3-5-2' | '3-4-2-1' | '3-4-3' | '4-1-2-1-2' | '4-1-3-2' | '4-2-1-3' | '4-2-2-2' | '4-2-3-1' | '4-2-3-1(2)' | '4-2-4' | '4-3-1-2' | '4-3-3' | '4-3-3(2)' | '4-3-3(3)' | '4-3-3(4)' | '4-4-2' | '4-4-1-1' | '4-4-2(2)' | '4-5-1' | '4-5-1(2)' | '5-2-1-2' | '5-2-3' | '5-3-2' | '5-4-1';

// Конфигурации схем
const FORMATIONS: Record<string, {x: number, y: number}[]> = {
  '3-1-4-2': [
    // Вратарь
    { x: 0.05, y: 0.5 }, // x и y в долях от размеров поля
    // 3 защитника (плотнее в центре)
    { x: 0.16, y: 0.3 },  // левый защитник
    { x: 0.16, y: 0.5 },  // центральный защитник
    { x: 0.16, y: 0.7 },  // правый защитник
    // 1 опорный полузащитник
    { x: 0.275, y: 0.5 },
    // 4 полузащитника
    { x: 0.375, y: 0.02 }, // крайний сверху
    { x: 0.375, y: 0.34 }, // центральный сверху
    { x: 0.375, y: 0.66 }, // центральный снизу
    { x: 0.375, y: 0.98 }, // крайний снизу
    // 2 нападающих
    { x: 0.46, y: 0.35 }, // нападающий сверху
    { x: 0.46, y: 0.65 }  // нападающий снизу
  ],
  '3-4-1-2': [
    // Вратарь
    { x: 0.05, y: 0.5 },
    // 3 защитника (плотнее в центре)
    { x: 0.16, y: 0.3 },  // левый защитник
    { x: 0.16, y: 0.5 },  // центральный защитник
    { x: 0.16, y: 0.7 },  // правый защитник
    // 4 полузащитника
    { x: 0.275, y: 0.15 }, // полузащитник сверху
    { x: 0.275, y: 0.38 }, // центральный сверху
    { x: 0.275, y: 0.62 }, // центральный снизу
    { x: 0.275, y: 0.85 }, // полузащитник снизу
    // 1 атакующий полузащитник (CAM в центре)
    { x: 0.3875, y: 0.5 },
    // 2 нападающих (в центре)
    { x: 0.46, y: 0.35 }, // нападающий сверху
    { x: 0.46, y: 0.65 }  // нападающий снизу
  ],
  '3-5-2': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // CB - 3 защитника (плотно в центре)
    { x: 0.16, y: 0.3 },  // левый CB
    { x: 0.16, y: 0.5 },  // центральный CB
    { x: 0.16, y: 0.7 },  // правый CB
    // CDM - 2 опорных полузащитника (ближе к защите)
    { x: 0.27, y: 0.4 },  // левый CDM
    { x: 0.27, y: 0.6 },  // правый CDM
    // LM, RM - фланговые полузащитники (широко)
    { x: 0.32, y: 0.1 },  // LM (левый фланг)
    { x: 0.32, y: 0.9 },  // RM (правый фланг)
    // CAM - атакующий полузащитник (между CDM и ST)
    { x: 0.38, y: 0.5 },  // CAM в центре
    // ST - 2 нападающих
    { x: 0.46, y: 0.35 }, // левый ST
    { x: 0.46, y: 0.65 }  // правый ST
  ],
  '3-4-2-1': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // CB - 3 защитника (плотно в центре)
    { x: 0.16, y: 0.3 },  // левый CB
    { x: 0.16, y: 0.5 },  // центральный CB
    { x: 0.16, y: 0.7 },  // правый CB
    // CM - 2 центральных полузащитника
    { x: 0.28, y: 0.4 },  // левый CM
    { x: 0.28, y: 0.6 },  // правый CM
    // LM, RM - фланговые полузащитники
    { x: 0.28, y: 0.15 }, // LM (левый фланг)
    { x: 0.28, y: 0.85 }, // RM (правый фланг)
    // CAM - 2 атакующих полузащитника (в центральной зоне)
    { x: 0.38, y: 0.4 },  // левый CAM
    { x: 0.38, y: 0.6 },  // правый CAM
    // ST - 1 нападающий
    { x: 0.46, y: 0.5 }   // центральный ST
  ],
  '3-4-3': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // CB - 3 защитника (плотно в центре)
    { x: 0.16, y: 0.3 },  // левый CB
    { x: 0.16, y: 0.5 },  // центральный CB  
    { x: 0.16, y: 0.7 },  // правый CB
    // CM - 2 центральных полузащитника
    { x: 0.28, y: 0.4 },  // левый CM
    { x: 0.28, y: 0.6 },  // правый CM
    // LM, RM - фланговые полузащитники
    { x: 0.28, y: 0.15 }, // LM (левый фланг)
    { x: 0.28, y: 0.85 }, // RM (правый фланг)
    // Нападающие: 3 = 1 по центру + 2 по флангам
    // LW - левый крайний нападающий
    { x: 0.46, y: 0.2 },  // LW
    // ST - центральный нападающий
    { x: 0.46, y: 0.5 },  // ST
    // RW - правый крайний нападающий  
    { x: 0.46, y: 0.8 }   // RW
  ],
  '4-1-2-1-2': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 4 защитника (широко, так как их 4)
    { x: 0.16, y: 0.1 },  // LB (левый бек)
    { x: 0.16, y: 0.35 }, // левый CB
    { x: 0.16, y: 0.65 }, // правый CB
    { x: 0.16, y: 0.9 },  // RB (правый бек)
    // 1 CDM - опорный полузащитник
    { x: 0.28, y: 0.5 },  // CDM в центре
    // 2 полузащитника (LM/RM по флангам)
    { x: 0.32, y: 0.2 },  // LM (левый фланг)
    { x: 0.32, y: 0.8 },  // RM (правый фланг)
    // 1 CAM - атакующий полузащитник
    { x: 0.38, y: 0.5 },  // CAM в центре
    // 2 нападающих
    { x: 0.46, y: 0.35 }, // левый ST
    { x: 0.46, y: 0.65 }  // правый ST
  ],
  '4-1-3-2': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 4 защитника (широко, так как их 4)
    { x: 0.16, y: 0.1 },  // LB (левый бек)
    { x: 0.16, y: 0.35 }, // левый CB
    { x: 0.16, y: 0.65 }, // правый CB
    { x: 0.16, y: 0.9 },  // RB (правый бек)
    // 1 CDM - опорный полузащитник
    { x: 0.28, y: 0.5 },  // CDM в центре
    // 3 полузащитника: 1 центральный + 2 по флангам
    { x: 0.34, y: 0.5 },  // CM (центральный)
    { x: 0.34, y: 0.2 },  // LM (левый фланг)
    { x: 0.34, y: 0.8 },  // RM (правый фланг)
    // 2 нападающих
    { x: 0.46, y: 0.35 }, // левый ST
    { x: 0.46, y: 0.65 }  // правый ST
  ],
  '4-2-1-3': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 4 защитника (широко, так как их 4)
    { x: 0.16, y: 0.1 },  // LB (левый бек)
    { x: 0.16, y: 0.35 }, // левый CB
    { x: 0.16, y: 0.65 }, // правый CB
    { x: 0.16, y: 0.9 },  // RB (правый бек)
    // 2 CDM - опорные полузащитники (ближе к защите)
    { x: 0.28, y: 0.4 },  // левый CDM
    { x: 0.28, y: 0.6 },  // правый CDM
    // 1 CAM - атакующий полузащитник
    { x: 0.38, y: 0.5 },  // CAM в центре
    // 3 нападающих: 1 центр + 2 фланга
    { x: 0.46, y: 0.2 },  // LW (левый крайний)
    { x: 0.46, y: 0.5 },  // ST (центральный)
    { x: 0.46, y: 0.8 }   // RW (правый крайний)
  ],
  '4-2-2-2': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 4 защитника (широко, так как их 4)
    { x: 0.16, y: 0.1 },  // LB (левый бек)
    { x: 0.16, y: 0.35 }, // левый CB
    { x: 0.16, y: 0.65 }, // правый CB
    { x: 0.16, y: 0.9 },  // RB (правый бек)
    // 2 CDM - опорные полузащитники (ближе к защите)
    { x: 0.28, y: 0.4 },  // левый CDM
    { x: 0.28, y: 0.6 },  // правый CDM
    // 2 CAM - атакующие полузащитники (в центральной зоне)
    { x: 0.38, y: 0.4 },  // левый CAM
    { x: 0.38, y: 0.6 },  // правый CAM
    // 2 нападающих (в центре)
    { x: 0.46, y: 0.35 }, // левый ST
    { x: 0.46, y: 0.65 }  // правый ST
  ],
  '4-2-3-1': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 4 защитника (широко, так как их 4)
    { x: 0.16, y: 0.1 },  // LB (левый бек)
    { x: 0.16, y: 0.35 }, // левый CB
    { x: 0.16, y: 0.65 }, // правый CB
    { x: 0.16, y: 0.9 },  // RB (правый бек)
    // 2 CDM - опорные полузащитники (ближе к защите)
    { x: 0.28, y: 0.4 },  // левый CDM
    { x: 0.28, y: 0.6 },  // правый CDM
    // 3 CAM - атакующие полузащитники (в центральной зоне, так как ЦАП не широко)
    { x: 0.38, y: 0.35 }, // левый CAM
    { x: 0.38, y: 0.5 },  // центральный CAM
    { x: 0.38, y: 0.65 }, // правый CAM
    // 1 нападающий
    { x: 0.46, y: 0.5 }   // центральный ST
  ],
  '4-2-3-1(2)': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 4 защитника (широко, так как их 4)
    { x: 0.16, y: 0.1 },  // LB (левый бек)
    { x: 0.16, y: 0.35 }, // левый CB
    { x: 0.16, y: 0.65 }, // правый CB
    { x: 0.16, y: 0.9 },  // RB (правый бек)
    // 2 CDM - опорные полузащитники (ближе к защите)
    { x: 0.28, y: 0.4 },  // левый CDM
    { x: 0.28, y: 0.6 },  // правый CDM
    // 3 полузащитника: 1 CAM в центре + LM/RM по флангам (модификация)
    { x: 0.38, y: 0.15 }, // LM (левый фланг)
    { x: 0.38, y: 0.5 },  // CAM (центральный)
    { x: 0.38, y: 0.85 }, // RM (правый фланг)
    // 1 нападающий
    { x: 0.46, y: 0.5 }   // центральный ST
  ],
  '4-2-4': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 4 защитника (широко, так как их 4)
    { x: 0.16, y: 0.1 },  // LB (левый бек)
    { x: 0.16, y: 0.35 }, // левый CB
    { x: 0.16, y: 0.65 }, // правый CB
    { x: 0.16, y: 0.9 },  // RB (правый бек)
    // 2 полузащитника - центральные CM
    { x: 0.28, y: 0.4 },  // левый CM
    { x: 0.28, y: 0.6 },  // правый CM
    // 4 нападающих: 2 по центру + 2 по флангам
    { x: 0.46, y: 0.15 }, // LW (левый крайний)
    { x: 0.46, y: 0.38 }, // левый ST
    { x: 0.46, y: 0.62 }, // правый ST
    { x: 0.46, y: 0.85 }  // RW (правый крайний)
  ],
  '4-3-1-2': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 4 защитника (широко, так как их 4)
    { x: 0.16, y: 0.1 },  // LB (левый бек)
    { x: 0.16, y: 0.35 }, // левый CB
    { x: 0.16, y: 0.65 }, // правый CB
    { x: 0.16, y: 0.9 },  // RB (правый бек)
    // 3 полузащитника: треугольником (1 CDM сзади + 2 CM впереди)
    { x: 0.28, y: 0.5 },  // CDM (опорный в центре)
    { x: 0.32, y: 0.35 }, // левый CM
    { x: 0.32, y: 0.65 }, // правый CM
    // 1 CAM - атакующий полузащитник
    { x: 0.38, y: 0.5 },  // CAM в центре
    // 2 нападающих
    { x: 0.46, y: 0.35 }, // левый ST
    { x: 0.46, y: 0.65 }  // правый ST
  ],
  '4-3-3': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 4 защитника (широко, так как их 4)
    { x: 0.16, y: 0.1 },  // LB (левый бек)
    { x: 0.16, y: 0.35 }, // левый CB
    { x: 0.16, y: 0.65 }, // правый CB
    { x: 0.16, y: 0.9 },  // RB (правый бек)
    // 3 центральных полузащитника (классическая линия)
    { x: 0.28, y: 0.35 }, // левый CM
    { x: 0.28, y: 0.5 },  // центральный CM
    { x: 0.28, y: 0.65 }, // правый CM
    // 3 нападающих: LW-ST-RW
    { x: 0.46, y: 0.2 },  // LW (левый вингер)
    { x: 0.46, y: 0.5 },  // ST (центральный нападающий)
    { x: 0.46, y: 0.8 }   // RW (правый вингер)
  ],
  '4-3-3(2)': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 4 защитника (широко, так как их 4)
    { x: 0.16, y: 0.1 },  // LB (левый бек)
    { x: 0.16, y: 0.35 }, // левый CB
    { x: 0.16, y: 0.65 }, // правый CB
    { x: 0.16, y: 0.9 },  // RB (правый бек)
    // 1 CDM + 2 CM (более оборонительная)
    { x: 0.26, y: 0.5 },  // CDM (опорный полузащитник)
    { x: 0.3, y: 0.35 },  // левый CM
    { x: 0.3, y: 0.65 },  // правый CM
    // 3 нападающих: LW-ST-RW
    { x: 0.46, y: 0.2 },  // LW (левый вингер)
    { x: 0.46, y: 0.5 },  // ST (центральный нападающий)
    { x: 0.46, y: 0.8 }   // RW (правый вингер)
  ],
  '4-3-3(3)': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 4 защитника (широко, так как их 4)
    { x: 0.16, y: 0.1 },  // LB (левый бек)
    { x: 0.16, y: 0.35 }, // левый CB
    { x: 0.16, y: 0.65 }, // правый CB
    { x: 0.16, y: 0.9 },  // RB (правый бек)
    // 2 CDM + 1 CM (еще более оборонительная)
    { x: 0.26, y: 0.4 },  // левый CDM
    { x: 0.26, y: 0.6 },  // правый CDM
    { x: 0.32, y: 0.5 },  // CM (центральный полузащитник)
    // 3 нападающих: LW-ST-RW
    { x: 0.46, y: 0.2 },  // LW (левый вингер)
    { x: 0.46, y: 0.5 },  // ST (центральный нападающий)
    { x: 0.46, y: 0.8 }   // RW (правый вингер)
  ],
  '4-3-3(4)': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 4 защитника (широко, так как их 4)
    { x: 0.16, y: 0.1 },  // LB (левый бек)
    { x: 0.16, y: 0.35 }, // левый CB
    { x: 0.16, y: 0.65 }, // правый CB
    { x: 0.16, y: 0.9 },  // RB (правый бек)
    // 2 CM + 1 CAM (более атакующая)
    { x: 0.26, y: 0.4 },  // левый CM
    { x: 0.26, y: 0.6 },  // правый CM
    { x: 0.34, y: 0.5 },  // CAM (атакующий полузащитник)
    // 3 нападающих: LW-ST-RW
    { x: 0.46, y: 0.2 },  // LW (левый вингер)
    { x: 0.46, y: 0.5 },  // ST (центральный нападающий)
    { x: 0.46, y: 0.8 }   // RW (правый вингер)
  ],
  '4-4-2': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 4 защитника (широко, так как их 4)
    { x: 0.16, y: 0.1 },  // LB (левый бек)
    { x: 0.16, y: 0.35 }, // левый CB
    { x: 0.16, y: 0.65 }, // правый CB
    { x: 0.16, y: 0.9 },  // RB (правый бек)
    // 4 полузащитника: LM-CM-CM-RM
    { x: 0.28, y: 0.1 },  // LM (левый полузащитник)
    { x: 0.28, y: 0.38 }, // левый CM
    { x: 0.28, y: 0.62 }, // правый CM
    { x: 0.28, y: 0.9 },  // RM (правый полузащитник)
    // 2 нападающих
    { x: 0.46, y: 0.35 }, // левый ST
    { x: 0.46, y: 0.65 }  // правый ST
  ],
  '4-4-1-1': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 4 защитника (широко, так как их 4)
    { x: 0.16, y: 0.1 },  // LB (левый бек)
    { x: 0.16, y: 0.35 }, // левый CB
    { x: 0.16, y: 0.65 }, // правый CB
    { x: 0.16, y: 0.9 },  // RB (правый бек)
    // 4 полузащитника: LM-CM-CM-RM
    { x: 0.28, y: 0.1 },  // LM (левый полузащитник)
    { x: 0.28, y: 0.38 }, // левый CM
    { x: 0.28, y: 0.62 }, // правый CM
    { x: 0.28, y: 0.9 },  // RM (правый полузащитник)
    // 1 CAM + 1 ST
    { x: 0.38, y: 0.5 },  // CAM (атакующий полузащитник)
    { x: 0.46, y: 0.5 }   // ST (нападающий)
  ],
  '4-4-2(2)': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 4 защитника (широко, так как их 4)
    { x: 0.16, y: 0.1 },  // LB (левый бек)
    { x: 0.16, y: 0.35 }, // левый CB
    { x: 0.16, y: 0.65 }, // правый CB
    { x: 0.16, y: 0.9 },  // RB (правый бек)
    // 4 полузащитника: LM-CDM-CDM-RM (более оборонительная версия)
    { x: 0.28, y: 0.1 },  // LM (левый полузащитник)
    { x: 0.28, y: 0.38 }, // левый CDM
    { x: 0.28, y: 0.62 }, // правый CDM
    { x: 0.28, y: 0.9 },  // RM (правый полузащитник)
    // 2 нападающих
    { x: 0.46, y: 0.35 }, // левый ST
    { x: 0.46, y: 0.65 }  // правый ST
  ],
  '4-5-1': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 4 защитника (широко, так как их 4)
    { x: 0.16, y: 0.1 },  // LB (левый бек)
    { x: 0.16, y: 0.35 }, // левый CB
    { x: 0.16, y: 0.65 }, // правый CB
    { x: 0.16, y: 0.9 },  // RB (правый бек)
    // 5 полузащитников: LM-CM-CAM-CM-RM
    { x: 0.28, y: 0.05 }, // LM (левый полузащитник)
    { x: 0.28, y: 0.35 }, // левый CM
    { x: 0.34, y: 0.5 },  // CAM (атакующий полузащитник)
    { x: 0.28, y: 0.65 }, // правый CM
    { x: 0.28, y: 0.95 }, // RM (правый полузащитник)
    // 1 нападающий
    { x: 0.46, y: 0.5 }   // ST (центральный нападающий)
  ],
  '4-5-1(2)': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 4 защитника (широко, так как их 4)
    { x: 0.16, y: 0.1 },  // LB (левый бек)
    { x: 0.16, y: 0.35 }, // левый CB
    { x: 0.16, y: 0.65 }, // правый CB
    { x: 0.16, y: 0.9 },  // RB (правый бек)
    // 5 полузащитников: LM-CM-CM-CM-RM (равномерное распределение)
    { x: 0.28, y: 0.05 }, // LM (левый полузащитник)
    { x: 0.3, y: 0.3 },   // левый CM
    { x: 0.3, y: 0.5 },   // центральный CM
    { x: 0.3, y: 0.7 },   // правый CM
    { x: 0.28, y: 0.95 }, // RM (правый полузащитник)
    // 1 нападающий
    { x: 0.46, y: 0.5 }   // ST (центральный нападающий)
  ],
  '5-2-1-2': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 5 защитников (очень широко с wing-back)
    { x: 0.16, y: 0.05 }, // LWB (левый wing-back)
    { x: 0.16, y: 0.3 },  // левый CB
    { x: 0.16, y: 0.5 },  // центральный CB
    { x: 0.16, y: 0.7 },  // правый CB
    { x: 0.16, y: 0.95 }, // RWB (правый wing-back)
    // 2 полузащитника (центральные)
    { x: 0.28, y: 0.38 }, // левый CM
    { x: 0.28, y: 0.62 }, // правый CM
    // 1 CAM
    { x: 0.38, y: 0.5 },  // CAM (атакующий полузащитник)
    // 2 нападающих
    { x: 0.46, y: 0.35 }, // левый ST
    { x: 0.46, y: 0.65 }  // правый ST
  ],
  '5-2-3': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 5 защитников (очень широко с wing-back)
    { x: 0.16, y: 0.05 }, // LWB (левый wing-back)
    { x: 0.16, y: 0.3 },  // левый CB
    { x: 0.16, y: 0.5 },  // центральный CB
    { x: 0.16, y: 0.7 },  // правый CB
    { x: 0.16, y: 0.95 }, // RWB (правый wing-back)
    // 2 полузащитника (центральные)
    { x: 0.28, y: 0.38 }, // левый CM
    { x: 0.28, y: 0.62 }, // правый CM
    // 3 нападающих: LW-ST-RW
    { x: 0.46, y: 0.2 },  // LW (левый вингер)
    { x: 0.46, y: 0.5 },  // ST (центральный нападающий)
    { x: 0.46, y: 0.8 }   // RW (правый вингер)
  ],
  '5-3-2': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 5 защитников (очень широко с wing-back)
    { x: 0.16, y: 0.05 }, // LWB (левый wing-back)
    { x: 0.16, y: 0.3 },  // левый CB
    { x: 0.16, y: 0.5 },  // центральный CB
    { x: 0.16, y: 0.7 },  // правый CB
    { x: 0.16, y: 0.95 }, // RWB (правый wing-back)
    // 3 полузащитника
    { x: 0.28, y: 0.35 }, // левый CM
    { x: 0.28, y: 0.5 },  // центральный CM (или CDM)
    { x: 0.28, y: 0.65 }, // правый CM
    // 2 нападающих
    { x: 0.46, y: 0.35 }, // левый ST
    { x: 0.46, y: 0.65 }  // правый ST
  ],
  '5-4-1': [
    // GK - Вратарь
    { x: 0.05, y: 0.5 },
    // 5 защитников (очень широко с wing-back)
    { x: 0.16, y: 0.05 }, // LWB (левый wing-back)
    { x: 0.16, y: 0.3 },  // левый CB
    { x: 0.16, y: 0.5 },  // центральный CB
    { x: 0.16, y: 0.7 },  // правый CB
    { x: 0.16, y: 0.95 }, // RWB (правый wing-back)
    // 4 полузащитника: LM-CM-CM-RM
    { x: 0.28, y: 0.15 }, // LM (левый полузащитник)
    { x: 0.28, y: 0.38 }, // левый CM
    { x: 0.28, y: 0.62 }, // правый CM
    { x: 0.28, y: 0.85 }, // RM (правый полузащитник)
    // 1 нападающий
    { x: 0.46, y: 0.5 }   // ST (центральный нападающий)
  ]
};

const FIELD_WIDTH = 800;
const FIELD_HEIGHT = 500;
const CHIP_SIZE = 30;
const TOTAL_HEIGHT = FIELD_HEIGHT + 150; // Общая высота с зоной для фишек

export default function FieldSimulatorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fieldRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedChip, setDraggedChip] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [creatingArrow, setCreatingArrow] = useState<{chipId: number, startX: number, startY: number} | null>(null);
  const [tempArrowEnd, setTempArrowEnd] = useState<{x: number, y: number} | null>(null);
  const [hoveredChip, setHoveredChip] = useState<number | null>(null);
  const [hoveredArrow, setHoveredArrow] = useState<number | null>(null);
  const [selectedArrow, setSelectedArrow] = useState<number | null>(null);
  const [editingArrow, setEditingArrow] = useState<number | null>(null);
  const [isDraggingArrow, setIsDraggingArrow] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [creatingZone, setCreatingZone] = useState<{startX: number, startY: number} | null>(null);
  const [tempZoneEnd, setTempZoneEnd] = useState<{x: number, y: number} | null>(null);
  const [pendingZone, setPendingZone] = useState<{startX: number, startY: number, endX: number, endY: number} | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState<{x: number, y: number} | null>(null);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [editingZone, setEditingZone] = useState<number | null>(null);
  const [resizeHandle, setResizeHandle] = useState<'se' | null>(null); // юго-восточный угол
  const [blueFormation, setBlueFormation] = useState<Formation>('default');
  const [yellowFormation, setYellowFormation] = useState<Formation>('default');

  // Проверяем роль админа
  if (user?.role !== 'ADMIN') {
    router.push('/');
    return null;
  }

  // Инициализируем фишки - по умолчанию под полем горизонтально
  const [players, setPlayers] = useState<PlayerChip[]>(() => {
    const chips: PlayerChip[] = [];
    
    // Синие фишки (11 штук) - первый ряд под полем
    for (let i = 0; i < 11; i++) {
      chips.push({
        id: i,
        x: 50 + i * 40, // горизонтально с интервалом 40px
        y: FIELD_HEIGHT + 50, // под полем
        team: 'blue'
      });
    }
    
    // Желтые фишки (11 штук) - второй ряд под полем
    for (let i = 0; i < 11; i++) {
      chips.push({
        id: i + 11,
        x: 50 + i * 40, // горизонтально с интервалом 40px
        y: FIELD_HEIGHT + 90, // ниже синих фишек
        team: 'yellow'
      });
    }
    
    // Белая фишка (мяч) - в центре поля
    chips.push({
      id: 22,
      x: FIELD_WIDTH / 2, // центр поля по x
      y: FIELD_HEIGHT / 2, // центр поля по y
      team: 'white'
    });
    
    return chips;
  });

  const handleMouseDown = useCallback((e: React.MouseEvent, chipId: number) => {
    e.preventDefault();
    const chip = players.find(p => p.id === chipId);
    if (!chip || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - containerRect.left - chip.x;
    const offsetY = e.clientY - containerRect.top - chip.y;

    setDraggedChip(chipId);
    setDragOffset({ x: offsetX, y: offsetY });
  }, [players]);

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (draggedChip !== null && !containerRef.current) return;
    if (creatingArrow !== null && !containerRef.current) return;
    if (editingArrow !== null && !containerRef.current) return;
    if (creatingZone !== null && !containerRef.current) return;

    const containerRect = containerRef.current!.getBoundingClientRect();

    // Обработка перетаскивания фишки
    if (draggedChip !== null) {
      const newX = e.clientX - containerRect.left - dragOffset.x;
      const newY = e.clientY - containerRect.top - dragOffset.y;

      const clampedX = Math.max(CHIP_SIZE / 2, Math.min(FIELD_WIDTH - CHIP_SIZE / 2, newX));
      const clampedY = Math.max(CHIP_SIZE / 2, Math.min(TOTAL_HEIGHT - CHIP_SIZE / 2, newY));

      setPlayers(prev => 
        prev.map(player => 
          player.id === draggedChip 
            ? { ...player, x: clampedX, y: clampedY }
            : player
        )
      );

      // Обновляем стрелки, которые начинаются от перемещаемой фишки
      setArrows(prev => 
        prev.map(arrow => 
          arrow.fromChipId === draggedChip 
            ? { ...arrow, startX: clampedX, startY: clampedY }
            : arrow
        )
      );
    }

    // Обработка создания стрелки
    if (creatingArrow !== null) {
      const endX = e.clientX - containerRect.left;
      const endY = e.clientY - containerRect.top;

      // Ограничиваем конец стрелки границами поля
      const clampedEndX = Math.max(0, Math.min(FIELD_WIDTH, endX));
      const clampedEndY = Math.max(0, Math.min(FIELD_HEIGHT, endY));

      setTempArrowEnd({ x: clampedEndX, y: clampedEndY });
    }

    // Обработка редактирования стрелки
    if (editingArrow !== null) {
      setIsDraggingArrow(true);
      const endX = e.clientX - containerRect.left;
      const endY = e.clientY - containerRect.top;

      // Ограничиваем конец стрелки границами поля
      const clampedEndX = Math.max(0, Math.min(FIELD_WIDTH, endX));
      const clampedEndY = Math.max(0, Math.min(FIELD_HEIGHT, endY));

      setArrows(prev => 
        prev.map(arrow => 
          arrow.id === editingArrow 
            ? { ...arrow, endX: clampedEndX, endY: clampedEndY }
            : arrow
        )
      );
    }

    // Обработка создания зоны
    if (creatingZone !== null) {
      const endX = e.clientX - containerRect.left;
      const endY = e.clientY - containerRect.top;

      // Ограничиваем границами поля
      const clampedEndX = Math.max(0, Math.min(FIELD_WIDTH, endX));
      const clampedEndY = Math.max(0, Math.min(FIELD_HEIGHT, endY));

      setTempZoneEnd({ x: clampedEndX, y: clampedEndY });
    }

    // Обработка изменения размера зоны
    if (editingZone !== null && resizeHandle === 'se') {
      const endX = e.clientX - containerRect.left;
      const endY = e.clientY - containerRect.top;

      // Ограничиваем границами поля
      const clampedEndX = Math.max(0, Math.min(FIELD_WIDTH, endX));
      const clampedEndY = Math.max(0, Math.min(FIELD_HEIGHT, endY));

      setZones(prev => 
        prev.map(zone => 
          zone.id === editingZone 
            ? { ...zone, endX: clampedEndX, endY: clampedEndY }
            : zone
        )
      );
    }
  }, [draggedChip, dragOffset, creatingArrow, editingArrow, creatingZone, editingZone, resizeHandle]);

  const handleGlobalMouseUp = useCallback(() => {
    if (creatingArrow && tempArrowEnd) {
      // Создаем новую стрелку
      const newArrow: Arrow = {
        id: Date.now(),
        fromChipId: creatingArrow.chipId,
        startX: creatingArrow.startX,
        startY: creatingArrow.startY,
        endX: tempArrowEnd.x,
        endY: tempArrowEnd.y
      };
      setArrows(prev => [...prev, newArrow]);
      setCreatingArrow(null);
      setTempArrowEnd(null);
    }

    if (creatingZone && tempZoneEnd) {
      // Проверяем, что зона достаточно большая
      const width = Math.abs(tempZoneEnd.x - creatingZone.startX);
      const height = Math.abs(tempZoneEnd.y - creatingZone.startY);
      
      if (width > 20 && height > 20) {
        // Создаем pending зону сразу
        const newPendingZone: Zone = {
          id: Date.now(),
          startX: Math.min(creatingZone.startX, tempZoneEnd.x),
          startY: Math.min(creatingZone.startY, tempZoneEnd.y),
          endX: Math.max(creatingZone.startX, tempZoneEnd.x),
          endY: Math.max(creatingZone.startY, tempZoneEnd.y),
          color: 'pending'
        };
        setZones(prev => [...prev, newPendingZone]);
        
        setPendingZone({
          startX: creatingZone.startX,
          startY: creatingZone.startY,
          endX: tempZoneEnd.x,
          endY: tempZoneEnd.y
        });
        const pickerPos = {
          x: Math.max(0, Math.min(creatingZone.startX, tempZoneEnd.x) - 20),
          y: Math.max(0, Math.min(creatingZone.startY, tempZoneEnd.y) - 20)
        };
        setColorPickerPosition(pickerPos);
        setShowColorPicker(true);
      }
      setCreatingZone(null);
      setTempZoneEnd(null);
    }

    setDraggedChip(null);
    setDragOffset({ x: 0, y: 0 });
    setEditingArrow(null);
    setEditingZone(null);
    setResizeHandle(null);
    
    // Небольшая задержка перед сбросом isDraggingArrow для правильной обработки клика
    setTimeout(() => {
      setIsDraggingArrow(false);
    }, 100);
  }, [creatingArrow, tempArrowEnd, creatingZone, tempZoneEnd]);

  // Добавляем глобальные обработчики мыши для плавного перетаскивания
  useEffect(() => {
    if (draggedChip !== null || creatingArrow !== null || editingArrow !== null || creatingZone !== null || editingZone !== null) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [draggedChip, creatingArrow, editingArrow, creatingZone, editingZone, handleGlobalMouseMove, handleGlobalMouseUp]);

  // Обработчик для отмены pending зон при клике в любом месте
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (showColorPicker) {
        // Проверяем, что клик не по кружочкам выбора цвета
        const target = e.target as HTMLElement;
        if (!target.closest('[data-color-picker]')) {
          cancelZoneCreation();
        }
      }
    };

    if (showColorPicker) {
      // Добавляем небольшую задержку чтобы обработчик не сработал сразу после создания зоны
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleDocumentClick);
      }, 200);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleDocumentClick);
      };
    }
  }, [showColorPicker]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Эта функция теперь не используется, но оставляем для совместимости
  }, []);

  const handleMouseUp = useCallback(() => {
    // Эта функция теперь не используется, но оставляем для совместимости
  }, []);

  const deleteArrow = (arrowId: number) => {
    setArrows(prev => prev.filter(arrow => arrow.id !== arrowId));
    setSelectedArrow(null);
  };

  const selectArrow = (arrowId: number) => {
    setSelectedArrow(selectedArrow === arrowId ? null : arrowId);
  };

  const startEditingArrow = (e: React.MouseEvent, arrowId: number) => {
    e.stopPropagation();
    setEditingArrow(arrowId);
    setIsDraggingArrow(false);
  };

  const handleArrowClick = (arrowId: number) => {
    if (!isDraggingArrow) {
      selectArrow(arrowId);
    }
  };

  const handleFieldMouseDown = (e: React.MouseEvent) => {
    // Проверяем, что не создается стрелка и не перетаскивается фишка
    if (creatingArrow || editingArrow || draggedChip) return;
    
    // Если есть pending зона и кликаем мимо кружочков - удаляем её
    if (showColorPicker) {
      cancelZoneCreation();
      return;
    }
    
    const fieldElement = e.currentTarget;
    const rect = fieldElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Начинаем создание зоны
    setCreatingZone({ startX: x, startY: y });
  };

  const finishZoneCreation = (color: 'black' | 'purple' | 'white') => {
    if (pendingZone) {
      // Обновляем pending зону на финальную
      setZones(prev => prev.map(zone => 
        zone.color === 'pending' ? { ...zone, color } : zone
      ));
    }
    setPendingZone(null);
    setShowColorPicker(false);
    setColorPickerPosition(null);
  };

  const cancelZoneCreation = () => {
    // Удаляем pending зону
    setZones(prev => prev.filter(zone => zone.color !== 'pending'));
    setPendingZone(null);
    setShowColorPicker(false);
    setColorPickerPosition(null);
  };

  const selectZone = (zoneId: number) => {
    setSelectedZone(selectedZone === zoneId ? null : zoneId);
  };

  const deleteZone = (zoneId: number) => {
    setZones(prev => prev.filter(zone => zone.id !== zoneId));
    setSelectedZone(null);
  };

  const startResizingZone = (e: React.MouseEvent, zoneId: number) => {
    e.stopPropagation();
    setEditingZone(zoneId);
    setResizeHandle('se');
  };

  const applyFormation = (team: 'blue' | 'yellow', formation: Formation) => {
    if (formation === 'default') return;

    const isBlue = team === 'blue';
    const formationConfig = FORMATIONS[formation];
    
    if (!formationConfig) return;

    // Применяем позиции к игрокам
    setPlayers(prev => prev.map((player, index) => {
      if (player.team === team && index < (isBlue ? 11 : 22) && index >= (isBlue ? 0 : 11)) {
        const positionIndex = isBlue ? index : index - 11;
        if (positionIndex < formationConfig.length) {
          const config = formationConfig[positionIndex];
          // Для синей команды используем позицию как есть
          // Для желтой команды зеркалируем по x (1 - config.x)
          const x = isBlue ? config.x * FIELD_WIDTH : (1 - config.x) * FIELD_WIDTH;
          const y = config.y * FIELD_HEIGHT;
          return { ...player, x, y };
        }
      }
      return player;
    }));
  };

  const handleFormationChange = (team: 'blue' | 'yellow', formation: Formation) => {
    if (team === 'blue') {
      setBlueFormation(formation);
    } else {
      setYellowFormation(formation);
    }
    
    if (formation !== 'default') {
      applyFormation(team, formation);
    }
  };

  const resetPositions = () => {
    setPlayers(prev => prev.map((player, index) => {
      if (player.team === 'blue') {
        return { ...player, x: 50 + (index % 11) * 40, y: FIELD_HEIGHT + 50 };
      } else if (player.team === 'yellow') {
        return { ...player, x: 50 + ((index - 11) % 11) * 40, y: FIELD_HEIGHT + 90 };
      } else if (player.team === 'white') {
        return { ...player, x: FIELD_WIDTH / 2, y: FIELD_HEIGHT / 2 }; // мяч в центр поля
      }
      return player;
    }));
    setArrows([]); // Очищаем все стрелки при сбросе
    setSelectedArrow(null); // Очищаем выбранную стрелку
    setEditingArrow(null); // Очищаем редактируемую стрелку
    setIsDraggingArrow(false);
    setZones([]); // Очищаем все зоны
    setCreatingZone(null);
    setTempZoneEnd(null);
    setPendingZone(null);
    setShowColorPicker(false);
    setColorPickerPosition(null);
    setSelectedZone(null);
    setEditingZone(null);
    setResizeHandle(null);
    setBlueFormation('default');
    setYellowFormation('default');
  };

  const startCreatingArrow = (e: React.MouseEvent, chipId: number) => {
    e.stopPropagation();
    const chip = players.find(p => p.id === chipId);
    if (!chip) return;

    setCreatingArrow({
      chipId,
      startX: chip.x,
      startY: chip.y
    });
  };

  const renderArrow = (arrow: Arrow) => {
    const dx = arrow.endX - arrow.startX;
    const dy = arrow.endY - arrow.startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length < 10) return null; // Не рендерим очень короткие стрелки

    // Вычисляем угол для стрелки
    const angle = Math.atan2(dy, dx);
    const arrowHeadLength = 15;
    const arrowHeadAngle = Math.PI / 6;

    // Координаты стрелки (немного укорачиваем, чтобы не перекрывать фишку)
    const adjustedStartX = arrow.startX + (dx / length) * (CHIP_SIZE / 2);
    const adjustedStartY = arrow.startY + (dy / length) * (CHIP_SIZE / 2);

    // Определяем команду фишки, от которой исходит стрелка
    const fromChip = players.find(p => p.id === arrow.fromChipId);
    const team = fromChip?.team || 'blue';

    const isSelected = selectedArrow === arrow.id;
    const isEditing = editingArrow === arrow.id;
    
    // Базовые цвета для команд
    const baseColor = team === 'blue' ? '#333' : team === 'yellow' ? '#8b5cf6' : '#ffffff'; // черный для синих, фиолетовый для желтых, белый для мяча
    const baseMarker = team === 'blue' ? 'black' : team === 'yellow' ? 'purple' : 'white';
    
    // Выбираем цвет в зависимости от состояния
    const arrowColor = isSelected ? '#ef4444' : (isEditing ? '#f59e0b' : baseColor);
    const markerType = isSelected ? 'red' : (isEditing ? 'orange' : baseMarker);

    return (
      <g key={arrow.id}>
        {/* Невидимая толстая линия для клика */}
        <line
          x1={adjustedStartX}
          y1={adjustedStartY}
          x2={arrow.endX}
          y2={arrow.endY}
          stroke="transparent"
          strokeWidth="15"
          style={{ cursor: isEditing ? 'grabbing' : 'pointer' }}
          onClick={() => handleArrowClick(arrow.id)}
          onMouseDown={(e) => startEditingArrow(e, arrow.id)}
        />
        
        {/* Видимая линия стрелки */}
        <line
          x1={adjustedStartX}
          y1={adjustedStartY}
          x2={arrow.endX}
          y2={arrow.endY}
          stroke={arrowColor}
          strokeWidth="3"
          markerEnd={`url(#arrowhead-${markerType})`}
          style={{ pointerEvents: 'none' }}
        />
        
        {/* Кнопка удаления - показываем только для выбранной стрелки */}
        {isSelected && (
          <g>
            <circle
              cx={arrow.endX + 15}
              cy={arrow.endY - 15}
              r="10"
              fill="#ef4444"
              stroke="white"
              strokeWidth="2"
              onClick={(e) => {
                e.stopPropagation();
                deleteArrow(arrow.id);
              }}
              style={{ cursor: 'pointer' }}
            />
            <text
              x={arrow.endX + 15}
              y={arrow.endY - 15}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="14"
              fontWeight="bold"
              onClick={(e) => {
                e.stopPropagation();
                deleteArrow(arrow.id);
              }}
              style={{ cursor: 'pointer', pointerEvents: 'none' }}
            >
              −
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight border-b border-slate-200 pb-2 bg-gradient-to-r from-green-600 via-blue-600 to-yellow-600 bg-clip-text text-transparent">
            Емулятор футбольного поля
          </h1>
          <button
            onClick={resetPositions}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Скинути позиції
          </button>
        </div>

        <div className="flex justify-center">
          <div 
            ref={containerRef}
            className="relative"
            style={{ 
              width: FIELD_WIDTH,
              height: TOTAL_HEIGHT
            }}
          >
            {/* Футбольное поле */}
            <div 
              ref={fieldRef}
              className="relative bg-green-500 rounded-lg shadow-2xl border-4 border-white"
              style={{ 
                width: FIELD_WIDTH,
                height: FIELD_HEIGHT,
                backgroundImage: `
                  radial-gradient(circle at center, rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.05) 50%, transparent 50%)
                `,
                backgroundSize: '20px 20px, 40px 40px'
              }}
              onMouseDown={handleFieldMouseDown}
            >
              {/* Разметка поля */}
              {/* Центральная линия */}
              <div 
                className="absolute bg-white"
                style={{
                  left: '50%',
                  top: 0,
                  width: '2px',
                  height: '100%',
                  transform: 'translateX(-50%)'
                }}
              />
              
              {/* Центральный круг */}
              <div 
                className="absolute border-2 border-white rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  width: '120px',
                  height: '120px',
                  transform: 'translate(-50%, -50%)'
                }}
              />
              
              {/* Левые ворота */}
              <div 
                className="absolute border-2 border-white"
                style={{
                  left: 0,
                  top: '35%',
                  width: '60px',
                  height: '30%'
                }}
              />
              <div 
                className="absolute border-2 border-white"
                style={{
                  left: 0,
                  top: '20%',
                  width: '150px',
                  height: '60%'
                }}
              />
              
              {/* Правые ворота */}
              <div 
                className="absolute border-2 border-white"
                style={{
                  right: 0,
                  top: '35%',
                  width: '60px',
                  height: '30%'
                }}
              />
              <div 
                className="absolute border-2 border-white"
                style={{
                  right: 0,
                  top: '20%',
                  width: '150px',
                  height: '60%'
                }}
              />
            </div>

            {/* SVG для стрелок */}
            <svg 
              className="absolute top-0 left-0 pointer-events-none"
              style={{ 
                width: FIELD_WIDTH,
                height: FIELD_HEIGHT,
                pointerEvents: 'none'
              }}
            >
              {/* Определение стрелки */}
              <defs>
                <marker
                  id="arrowhead-black"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#333"
                  />
                </marker>
                <marker
                  id="arrowhead-red"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#ef4444"
                  />
                </marker>
                <marker
                  id="arrowhead-orange"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#f59e0b"
                  />
                </marker>
                <marker
                  id="arrowhead-purple"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#8b5cf6"
                  />
                </marker>
                <marker
                  id="arrowhead-white"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#ffffff"
                    stroke="#333"
                    strokeWidth="0.5"
                  />
                </marker>
              </defs>

              {/* Отрисовка стрелок */}
              <g style={{ pointerEvents: 'auto' }}>
                {/* Рендеринг зон */}
                {zones.map(zone => {
                  const isSelected = selectedZone === zone.id;
                  const isEditing = editingZone === zone.id;
                  
                  return (
                    <g key={zone.id}>
                      {/* Основной прямоугольник зоны */}
                      <rect
                        x={zone.startX}
                        y={zone.startY}
                        width={zone.endX - zone.startX}
                        height={zone.endY - zone.startY}
                        fill={zone.color === 'black' ? 'rgba(59,130,246,0.3)' : zone.color === 'purple' ? 'rgba(234,179,8,0.3)' : zone.color === 'white' ? 'rgba(255,255,255,0.3)' : 'rgba(128,128,128,0.2)'}
                        stroke={isSelected ? '#ef4444' : (isEditing ? '#f59e0b' : (zone.color === 'black' ? '#3b82f6' : zone.color === 'purple' ? '#eab308' : zone.color === 'white' ? '#ffffff' : '#666'))}
                        strokeWidth={isSelected || isEditing ? "3" : "2"}
                        strokeDasharray={isSelected || isEditing ? "3,3" : "5,5"}
                        style={{ cursor: 'pointer' }}
                        onClick={() => selectZone(zone.id)}
                      />
                      
                      {/* Ручка изменения размера для выбранной зоны */}
                      {isSelected && !isEditing && (
                        <rect
                          x={zone.endX - 8}
                          y={zone.endY - 8}
                          width="8"
                          height="8"
                          fill="#3b82f6"
                          stroke="white"
                          strokeWidth="1"
                          style={{ cursor: 'se-resize' }}
                          onMouseDown={(e) => startResizingZone(e, zone.id)}
                        />
                      )}
                      
                      {/* Кнопка удаления для выбранной зоны */}
                      {isSelected && !isEditing && (
                        <g>
                          <circle
                            cx={zone.endX + 15}
                            cy={zone.startY - 15}
                            r="10"
                            fill="#ef4444"
                            stroke="white"
                            strokeWidth="2"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteZone(zone.id);
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <text
                            x={zone.endX + 15}
                            y={zone.startY - 15}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="white"
                            fontSize="14"
                            fontWeight="bold"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteZone(zone.id);
                            }}
                            style={{ cursor: 'pointer', pointerEvents: 'none' }}
                          >
                            −
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Временная зона при создании */}
                {creatingZone && tempZoneEnd && !showColorPicker && (
                  <rect
                    x={Math.min(creatingZone.startX, tempZoneEnd.x)}
                    y={Math.min(creatingZone.startY, tempZoneEnd.y)}
                    width={Math.abs(tempZoneEnd.x - creatingZone.startX)}
                    height={Math.abs(tempZoneEnd.y - creatingZone.startY)}
                    fill="rgba(128,128,128,0.3)"
                    stroke="#666"
                    strokeWidth="2"
                    strokeDasharray="3,3"
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {arrows.map(arrow => renderArrow(arrow))}
                
                {/* Временная стрелка при создании */}
                {creatingArrow && tempArrowEnd && (
                  <line
                    x1={creatingArrow.startX}
                    y1={creatingArrow.startY}
                    x2={tempArrowEnd.x}
                    y2={tempArrowEnd.y}
                    stroke="#666"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    markerEnd="url(#arrowhead-black)"
                    style={{ pointerEvents: 'none' }}
                  />
                )}
              </g>
            </svg>

            {/* Фишки игроков */}
            {players.map((player) => (
              <div
                key={player.id}
                className={`absolute select-none ${
                  draggedChip === player.id ? 'z-50 scale-110' : 'z-10'
                }`}
                style={{
                  left: player.x - CHIP_SIZE / 2,
                  top: player.y - CHIP_SIZE / 2,
                  width: CHIP_SIZE,
                  height: CHIP_SIZE,
                  transition: draggedChip === player.id ? 'none' : 'transform 0.1s ease',
                  cursor: creatingArrow ? 'crosshair' : 'move'
                }}
                onMouseDown={(e) => {
                  if (!creatingArrow) {
                    handleMouseDown(e, player.id);
                  }
                }}
                onMouseEnter={() => setHoveredChip(player.id)}
                onMouseLeave={() => setHoveredChip(null)}
              >
                <div 
                  className={`w-full h-full rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold ${
                    player.team === 'blue' 
                      ? 'bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700' 
                      : player.team === 'yellow'
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700'
                      : 'bg-gradient-to-br from-gray-100 to-gray-300 hover:from-gray-200 hover:to-gray-400 border-gray-800 text-gray-800'
                  }`}
                  style={{
                    boxShadow: `
                      0 4px 8px rgba(0,0,0,0.3),
                      inset 0 2px 4px rgba(255,255,255,0.3),
                      inset 0 -2px 4px rgba(0,0,0,0.2)
                    `,
                    transition: 'none'
                  }}
                >
                  {player.team === 'blue' ? (player.id + 1) : player.team === 'yellow' ? (player.id - 10) : '⚽'}
                </div>

                {/* Кнопка + для создания стрелки */}
                {hoveredChip === player.id && !creatingArrow && !draggedChip && (
                  <button
                    className="absolute bg-green-500 hover:bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg transition-colors"
                    style={{
                      top: -8,
                      right: -8,
                      fontSize: '10px',
                      zIndex: 100
                    }}
                    onClick={(e) => startCreatingArrow(e, player.id)}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    +
                  </button>
                )}
              </div>
            ))}

            {/* Точки выбора цвета зоны */}
            {showColorPicker && colorPickerPosition && (
              <div 
                className="absolute flex space-x-1 z-50"
                data-color-picker
                style={{
                  left: colorPickerPosition.x,
                  top: colorPickerPosition.y
                }}
              >
                {/* Синий кружочек */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    finishZoneCreation('black');
                  }}
                  className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg hover:scale-110 transition-transform"
                  title="Синя команда"
                />
                {/* Желтый кружочек */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    finishZoneCreation('purple');
                  }}
                  className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-white shadow-lg hover:scale-110 transition-transform"
                  title="Жовта команда"
                />
                {/* Белый кружочек */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    finishZoneCreation('white');
                  }}
                  className="w-6 h-6 rounded-full bg-white border-2 border-gray-800 shadow-lg hover:scale-110 transition-transform"
                  title="М'яч"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white shadow-lg"></div>
            <span className="text-sm font-medium text-gray-700">Синя команда (11 гравців)</span>
            <div className="ml-2 w-4 h-0.5 bg-gray-800"></div>
            <span className="text-xs text-gray-500">чорні стрілки</span>
            <div className="ml-2 w-4 h-3 bg-blue-500 border border-blue-600 rounded-sm opacity-60"></div>
            <span className="text-xs text-gray-500">сині зони</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-white shadow-lg"></div>
            <span className="text-sm font-medium text-gray-700">Жовта команда (11 гравців)</span>
            <div className="ml-2 w-4 h-0.5 bg-purple-500"></div>
            <span className="text-xs text-gray-500">фіолетові стрілки</span>
            <div className="ml-2 w-4 h-3 bg-yellow-500 border border-yellow-600 rounded-sm opacity-60"></div>
            <span className="text-xs text-gray-500">жовті зони</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 border-2 border-gray-800 shadow-lg flex items-center justify-center text-gray-800 text-xs">⚽</div>
            <span className="text-sm font-medium text-gray-700">М'яч</span>
            <div className="ml-2 w-4 h-0.5 bg-white border border-gray-800"></div>
            <span className="text-xs text-gray-500">білі стрілки</span>
            <div className="ml-2 w-4 h-3 bg-white border border-gray-800 rounded-sm opacity-60"></div>
            <span className="text-xs text-gray-500">білі зони</span>
          </div>
        </div>

        <div className="mt-4 flex justify-center space-x-8">
          <div className="flex flex-col items-center space-y-2">
            <label className="text-sm font-medium text-gray-700">Схема Синя</label>
            <select
              value={blueFormation}
              onChange={(e) => handleFormationChange('blue', e.target.value as Formation)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="default">За замовчуванням</option>
              <option value="3-1-4-2">3-1-4-2</option>
              <option value="3-4-1-2">3-4-1-2</option>
              <option value="3-5-2">3-5-2</option>
              <option value="3-4-2-1">3-4-2-1</option>
              <option value="3-4-3">3-4-3</option>
              <option value="4-1-2-1-2">4-1-2-1-2</option>
              <option value="4-1-3-2">4-1-3-2</option>
              <option value="4-2-1-3">4-2-1-3</option>
              <option value="4-2-2-2">4-2-2-2</option>
              <option value="4-2-3-1">4-2-3-1</option>
              <option value="4-2-3-1(2)">4-2-3-1(2)</option>
              <option value="4-2-4">4-2-4</option>
              <option value="4-3-1-2">4-3-1-2</option>
              <option value="4-3-3">4-3-3</option>
              <option value="4-3-3(2)">4-3-3(2)</option>
              <option value="4-3-3(3)">4-3-3(3)</option>
              <option value="4-3-3(4)">4-3-3(4)</option>
              <option value="4-4-2">4-4-2</option>
              <option value="4-4-1-1">4-4-1-1</option>
              <option value="4-4-2(2)">4-4-2(2)</option>
              <option value="4-5-1">4-5-1</option>
              <option value="4-5-1(2)">4-5-1(2)</option>
              <option value="5-2-1-2">5-2-1-2</option>
              <option value="5-2-3">5-2-3</option>
              <option value="5-3-2">5-3-2</option>
              <option value="5-4-1">5-4-1</option>
            </select>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <label className="text-sm font-medium text-gray-700">Схема Жовта</label>
            <select
              value={yellowFormation}
              onChange={(e) => handleFormationChange('yellow', e.target.value as Formation)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="default">За замовчуванням</option>
              <option value="3-1-4-2">3-1-4-2</option>
              <option value="3-4-1-2">3-4-1-2</option>
              <option value="3-5-2">3-5-2</option>
              <option value="3-4-2-1">3-4-2-1</option>
              <option value="3-4-3">3-4-3</option>
              <option value="4-1-2-1-2">4-1-2-1-2</option>
              <option value="4-1-3-2">4-1-3-2</option>
              <option value="4-2-1-3">4-2-1-3</option>
              <option value="4-2-2-2">4-2-2-2</option>
              <option value="4-2-3-1">4-2-3-1</option>
              <option value="4-2-3-1(2)">4-2-3-1(2)</option>
              <option value="4-2-4">4-2-4</option>
              <option value="4-3-1-2">4-3-1-2</option>
              <option value="4-3-3">4-3-3</option>
              <option value="4-3-3(2)">4-3-3(2)</option>
              <option value="4-3-3(3)">4-3-3(3)</option>
              <option value="4-3-3(4)">4-3-3(4)</option>
              <option value="4-4-2">4-4-2</option>
              <option value="4-4-1-1">4-4-1-1</option>
              <option value="4-4-2(2)">4-4-2(2)</option>
              <option value="4-5-1">4-5-1</option>
              <option value="4-5-1(2)">4-5-1(2)</option>
              <option value="5-2-1-2">5-2-1-2</option>
              <option value="5-2-3">5-2-3</option>
              <option value="5-3-2">5-3-2</option>
              <option value="5-4-1">5-4-1</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          Перетягуйте фишки мишкою для розміщення гравців на полі
        </div>

        <div className="mt-2 text-center text-sm text-gray-500">
          Наведіть мишку на фишку і натисніть <span className="font-semibold text-green-600">+</span> для створення стрілки. 
          Клікніть на стрілку для вибору (стане червоною), потім натисніть <span className="font-semibold text-red-600">−</span> для видалення
        </div>

        <div className="mt-1 text-center text-sm text-gray-500">
          Зажміть і тягніть стрілку для зміни її напрямку і довжини (стане помаранчевою під час редагування)
        </div>

        <div className="mt-1 text-center text-sm text-gray-500">
          Клікніть і тягніть по полю для створення зон
        </div>

        <div className="mt-1 text-center text-sm text-gray-500">
          Клікніть на зону для вибору, потім тягніть синій квадратик для зміни розміру або натисніть <span className="font-semibold text-red-600">−</span> для видалення
        </div>
      </div>
    </AuthLayout>
  );
} 