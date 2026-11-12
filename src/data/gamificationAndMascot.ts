import {
  FitnessGoal,
  MascotForm,
  UserProfile,
  WorkoutPlan,
  ExerciseItem,
  MuscleCategory,
  EquipmentCategory,
  AccessoryCategory,
  AccessoryRarity,
  WorkoutSplitType,
  WorkoutSplitCategory,
} from '../types';

export const MASCOT_DATA: Record<
  MascotForm,
  {
    id: MascotForm;
    name: string;
    goal: FitnessGoal;
    goalLabel: string;
    tagline: string;
    description: string;
    imageUrl: string;
    badgeText: string;
    statsFocus: string;
    quotes: string[];
  }
> = {
  pombo_seco: {
    id: 'pombo_seco',
    name: 'Pombo Seco',
    goal: 'lose_weight',
    goalLabel: 'Emagrecimento',
    tagline: 'Atlético, ágil e com definição máxima',
    description:
      'Focado em gasto energético, resistência cardiovascular, manutenção de massa magra e constância metabólica.',
    imageUrl: '/assets/mascots/pombo_seco.jpg',
    badgeText: 'Emagrecimento & Definição',
    statsFocus: 'Consistência Semanal & Gasto Calórico Ativo',
    quotes: [
      'Cada sessão concluída e copo de água batido contam na sua definição!',
      'Ritmo constante vence a pressa. Respira fundo e mantém a cadência!',
      'Treino feito e descanso respeitado: é assim que o Pombo Seco voa alto!',
      'Postura firme e foco na execução. Nada de pular o aquecimento!',
    ],
  },
  pombo_grande: {
    id: 'pombo_grande',
    name: 'Pombo Grande',
    goal: 'gain_muscle',
    goalLabel: 'Ganho de Massa Muscular',
    tagline: 'Ombros largos, peitoral cheio e hipertrofia sólida',
    description:
      'Focado em hipertrofia muscular, controle de cadência, amplitude completa e progressão estruturada de volume.',
    imageUrl: '/assets/mascots/pombo_grande.jpg',
    badgeText: 'Hipertrofia & Volume',
    statsFocus: 'Tempo Sob Tensão & Volume Total por Grupo',
    quotes: [
      'Amplitude completa vale mais que carga jogada. Sinta o músculo trabalhar!',
      'Construir massa exige treino técnico, sono de qualidade e paciência.',
      'Mais uma série limpa no histórico! O Pombo Grande orgulha-se dessa evolução.',
      'Lembre-se: o músculo cresce na recuperação. Respeite seus dias de descanso!',
    ],
  },
  pombo_bruto: {
    id: 'pombo_bruto',
    name: 'Pombo Forte',
    goal: 'get_strong',
    goalLabel: 'Força e Condicionamento',
    tagline: 'Força bruta, base sólida e potência máxima',
    description:
      'Focado em exercícios básicos multiarticulares, estabilidade de core, progressão de carga segura e descansos estratégicos.',
    imageUrl: '/assets/mascots/pombo_bruto.jpg',
    badgeText: 'Força & Condicionamento',
    statsFocus: 'Progressão de Carga & Estabilidade Técnica',
    quotes: [
      'Força de verdade nasce da técnica impecável. Trave o abdômen e suba!',
      'Respeite o intervalo de descanso entre as séries pesadas para render 100%.',
      'Novo recorde pessoal registrado com segurança! O Pombo Forte aprova!',
      'Consistência mês após mês constrói uma base inabalável.',
    ],
  },
};

export function goalToMascotForm(goal: FitnessGoal): MascotForm {
  switch (goal) {
    case 'lose_weight':
      return 'pombo_seco';
    case 'gain_muscle':
      return 'pombo_grande';
    case 'get_strong':
      return 'pombo_bruto';
    default:
      return 'pombo_grande';
  }
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  category: 'treino' | 'consistencia' | 'recorde' | 'habitos';
  iconName: string;
  unlockAccessoryId?: string;
}

export const ACHIEVEMENTS_CATALOG: AchievementDef[] = [
  {
    id: 'first_workout',
    title: 'Primeiro Voo',
    description: 'Conclua seu primeiro treino completo registrado no PomboFit.',
    xpReward: 150,
    category: 'treino',
    iconName: 'Flame',
    unlockAccessoryId: 'headband_purple_pro',
  },
  {
    id: 'five_workouts',
    title: 'Cinco Treinos no Ninho',
    description: 'Realize 5 sessões completas de treinamento.',
    xpReward: 300,
    category: 'treino',
    iconName: 'Dumbbell',
    unlockAccessoryId: 'shoes_speed_violet',
  },
  {
    id: 'first_week_goal',
    title: 'Meta Semanal Alcançada',
    description: 'Atinja 100% da sua meta semanal de treinos planejados.',
    xpReward: 350,
    category: 'consistencia',
    iconName: 'CalendarCheck',
    unlockAccessoryId: 'outfit_elite_white',
  },
  {
    id: 'ten_workouts',
    title: 'Dez Treinos de Aço',
    description: 'Complete 10 treinos registrados com disciplina.',
    xpReward: 500,
    category: 'treino',
    iconName: 'Award',
    unlockAccessoryId: 'pose_double_biceps',
  },
  {
    id: 'first_pr',
    title: 'Primeiro Recorde Pessoal',
    description: 'Supere sua carga máxima anterior em qualquer exercício.',
    xpReward: 250,
    category: 'recorde',
    iconName: 'Trophy',
    unlockAccessoryId: 'acc_wristwraps_pro',
  },
  {
    id: 'thirty_days_consistency',
    title: '30 Dias de Consistência',
    description: 'Mantenha registros ativos ao longo de 30 dias respeitando os descansos.',
    xpReward: 1000,
    category: 'consistencia',
    iconName: 'ShieldCheck',
    unlockAccessoryId: 'outfit_royal_gold',
  },
  {
    id: 'hydration_master',
    title: 'Hidratação de Campeão',
    description: 'Atinja sua meta diária de água no módulo de Nutrição e Hábitos.',
    xpReward: 120,
    category: 'habitos',
    iconName: 'Droplets',
    unlockAccessoryId: 'acc_shaker_purple',
  },
  {
    id: 'body_tracker_init',
    title: 'Olho na Evolução',
    description: 'Registre sua primeira medição corporal na área Progresso.',
    xpReward: 120,
    category: 'habitos',
    iconName: 'Ruler',
  },
];

export interface MascotAccessoryItem {
  id: string;
  name: string;
  slot: 'hat' | 'glasses' | 'mask' | 'headband' | 'outfit' | 'special' | 'shoes' | 'pose' | 'medal';
  category: AccessoryCategory;
  categoryLabel: string;
  slotLabel: string;
  rarity: AccessoryRarity;
  requiredLevel: number;
  requiredAchievementId?: string;
  previewBadge: string;
  description: string;
  unlockHint: string;
}

export const MASCOT_ACCESSORIES: MascotAccessoryItem[] = [
  // 1. BONÉS E CHAPÉUS (hat)
  {
    id: 'hat_snapback_purple',
    name: 'Boné Aba Reta PomboFit',
    slot: 'hat',
    category: 'hat',
    categoryLabel: 'Bonés e Chapéus',
    slotLabel: 'Boné',
    rarity: 'common',
    requiredLevel: 1,
    previewBadge: 'Nível 1 · Inicial',
    description: 'Boné de aba reta roxo com bordado em relevo e ajuste snapback anatômico.',
    unlockHint: 'Desbloqueado desde o início para todos os atletas.',
  },
  {
    id: 'bone',
    name: 'Boné Esportivo Classic',
    slot: 'hat',
    category: 'hat',
    categoryLabel: 'Bonés e Chapéus',
    slotLabel: 'Boné',
    rarity: 'common',
    requiredLevel: 1,
    previewBadge: 'Nível 1 · Inicial',
    description: 'Boné aerodinâmico esportivo preto com aba curva roxa.',
    unlockHint: 'Disponível no nível 1.',
  },
  {
    id: 'hat_beanie_street',
    name: 'Gorro Streetwear Térmico',
    slot: 'hat',
    category: 'hat',
    categoryLabel: 'Bonés e Chapéus',
    slotLabel: 'Gorro',
    rarity: 'rare',
    requiredLevel: 3,
    previewBadge: 'Nível 3',
    description: 'Gorro canelado grafite com dobra roxa para treinos no frio.',
    unlockHint: 'Alcance o Nível 3 de consistência.',
  },
  {
    id: 'hat_visor_speed',
    name: 'Viseira Aerodinâmica Runner',
    slot: 'hat',
    category: 'hat',
    categoryLabel: 'Bonés e Chapéus',
    slotLabel: 'Viseira',
    rarity: 'rare',
    requiredLevel: 4,
    previewBadge: 'Nível 4',
    description: 'Viseira esportiva leve com faixa reflexiva lilás e máxima respirabilidade.',
    unlockHint: 'Alcance o Nível 4 de consistência.',
  },
  {
    id: 'chapeu',
    name: 'Chapéu Fedora Clássico',
    slot: 'hat',
    category: 'hat',
    categoryLabel: 'Bonés e Chapéus',
    slotLabel: 'Chapéu',
    rarity: 'rare',
    requiredLevel: 2,
    previewBadge: 'Nível 2',
    description: 'Chapéu elegante de feltro escuro com fita roxa aveludada.',
    unlockHint: 'Alcance o Nível 2 de consistência.',
  },
  {
    id: 'hat_ninja_hood',
    name: 'Capuz Tático Stealth',
    slot: 'hat',
    category: 'hat',
    categoryLabel: 'Bonés e Chapéus',
    slotLabel: 'Capuz',
    rarity: 'epic',
    requiredLevel: 6,
    previewBadge: 'Nível 6 · Épico',
    description: 'Capuz ergonômico escuro com caimento anatômico sobre os ombros do Pombo.',
    unlockHint: 'Alcance o Nível 6 de consistência.',
  },
  {
    id: 'hat_champion_crown',
    name: 'Coroa de Louros Dourada',
    slot: 'hat',
    category: 'hat',
    categoryLabel: 'Bonés e Chapéus',
    slotLabel: 'Coroa',
    rarity: 'legendary',
    requiredLevel: 10,
    previewBadge: 'Nível 10 · Lendário',
    description: 'Coroa de louros grega esculpida em ouro maciço brilhante para verdadeiros campeões.',
    unlockHint: 'Alcance o Nível 10 de consistência suprema.',
  },

  // 2. ÓCULOS (glasses)
  {
    id: 'oculos_sol',
    name: 'Óculos de Sol Classic Black',
    slot: 'glasses',
    category: 'glasses',
    categoryLabel: 'Óculos',
    slotLabel: 'Óculos',
    rarity: 'common',
    requiredLevel: 1,
    previewBadge: 'Nível 1 · Inicial',
    description: 'Lentes polarizadas com proteção UV e armação esportiva preta.',
    unlockHint: 'Disponível no nível 1.',
  },
  {
    id: 'oculos_esportivo',
    name: 'Óculos Esportivos Speed Violet',
    slot: 'glasses',
    category: 'glasses',
    categoryLabel: 'Óculos',
    slotLabel: 'Óculos',
    rarity: 'rare',
    requiredLevel: 2,
    previewBadge: 'Nível 2',
    description: 'Design curvado aerodinâmico com lente espelhada violeta.',
    unlockHint: 'Alcance o Nível 2 de consistência.',
  },
  {
    id: 'glasses_sport_shield',
    name: 'Óculos Performance Shield',
    slot: 'glasses',
    category: 'glasses',
    categoryLabel: 'Óculos',
    slotLabel: 'Óculos',
    rarity: 'rare',
    requiredLevel: 3,
    previewBadge: 'Nível 3',
    description: 'Lente única panorâmica iridescente com detalhes em fibra de carbono.',
    unlockHint: 'Alcance o Nível 3 de consistência.',
  },
  {
    id: 'glasses_cyber_visor',
    name: 'Visor HUD Neon Scouter',
    slot: 'glasses',
    category: 'glasses',
    categoryLabel: 'Óculos',
    slotLabel: 'Visor HUD',
    rarity: 'epic',
    requiredLevel: 5,
    previewBadge: 'Nível 5 · Épico',
    description: 'Visor biométrico cibernético translúcido com leitura holográfica de cargas.',
    unlockHint: 'Alcance o Nível 5 de consistência.',
  },
  {
    id: 'glasses_gold_aviator',
    name: 'Óculos Aviador Ouro 24k VIP',
    slot: 'glasses',
    category: 'glasses',
    categoryLabel: 'Óculos',
    slotLabel: 'Aviador',
    rarity: 'legendary',
    requiredLevel: 8,
    previewBadge: 'Nível 8 · Lendário',
    description: 'Armação banhada a ouro 24k com lentes degradê âmbar de alto luxo.',
    unlockHint: 'Alcance o Nível 8 de consistência.',
  },

  // 3. MÁSCARAS (mask)
  {
    id: 'hospitalar',
    name: 'Máscara Hospitalar Air-Shield',
    slot: 'mask',
    category: 'mask',
    categoryLabel: 'Máscaras',
    slotLabel: 'Máscara',
    rarity: 'common',
    requiredLevel: 1,
    previewBadge: 'Nível 1 · Inicial',
    description: 'Máscara cirúrgica azul celeste com elásticos de fixação.',
    unlockHint: 'Disponível no nível 1.',
  },
  {
    id: 'mask_tactical_stealth',
    name: 'Bandana Tática Neoprene',
    slot: 'mask',
    category: 'mask',
    categoryLabel: 'Máscaras',
    slotLabel: 'Bandana',
    rarity: 'common',
    requiredLevel: 2,
    previewBadge: 'Nível 2',
    description: 'Bandana ergonômica preta de neoprene com emblema PomboFit lilás no queixo.',
    unlockHint: 'Alcance o Nível 2 de consistência.',
  },
  {
    id: 'mask_altitude_pro',
    name: 'Máscara de Treino em Altitude',
    slot: 'mask',
    category: 'mask',
    categoryLabel: 'Máscaras',
    slotLabel: 'Máscara',
    rarity: 'rare',
    requiredLevel: 4,
    previewBadge: 'Nível 4',
    description: 'Válvulas duplas de restrição de fluxo para condicionamento pulmonar avançado.',
    unlockHint: 'Alcance o Nível 4 de consistência.',
  },
  {
    id: 'batman',
    name: 'Máscara Tática Noturna',
    slot: 'mask',
    category: 'mask',
    categoryLabel: 'Máscaras',
    slotLabel: 'Máscara',
    rarity: 'epic',
    requiredLevel: 5,
    previewBadge: 'Nível 5 · Épico',
    description: 'Máscara de vigilante blindada preta fosca com aberturas angulares para os olhos.',
    unlockHint: 'Alcance o Nível 5 de consistência.',
  },
  {
    id: 'mask_cyber_respirator',
    name: 'Respirador Cibernético LED',
    slot: 'mask',
    category: 'mask',
    categoryLabel: 'Máscaras',
    slotLabel: 'Respirador',
    rarity: 'epic',
    requiredLevel: 7,
    previewBadge: 'Nível 7 · Épico',
    description: 'Respirador de titânio escovado com filtros luminosos violeta pulsantes.',
    unlockHint: 'Alcance o Nível 7 de consistência.',
  },
  {
    id: 'mask_oni_warrior',
    name: 'Máscara Samurai das Trevas',
    slot: 'mask',
    category: 'mask',
    categoryLabel: 'Máscaras',
    slotLabel: 'Máscara Oni',
    rarity: 'legendary',
    requiredLevel: 9,
    previewBadge: 'Nível 9 · Lendário',
    description: 'Máscara de guerreiro japonês esculpida com relevo dourado e presas de ferro.',
    unlockHint: 'Alcance o Nível 9 de consistência.',
  },

  // 4. FAIXAS ESPORTIVAS (headband)
  {
    id: 'headband_classic',
    name: 'Faixa Atlética PomboFit Oficial',
    slot: 'headband',
    category: 'headband',
    categoryLabel: 'Faixas Esportivas',
    slotLabel: 'Faixa',
    rarity: 'common',
    requiredLevel: 1,
    previewBadge: 'Padrão Oficial',
    description: 'Faixa esportiva roxa original de alta absorção com costura dupla reforçada.',
    unlockHint: 'Acessório oficial de fábrica do mascote.',
  },
  {
    id: 'headband_stealth_black',
    name: 'Faixa Ninja Grafite Carbono',
    slot: 'headband',
    category: 'headband',
    categoryLabel: 'Faixas Esportivas',
    slotLabel: 'Faixa',
    rarity: 'common',
    requiredLevel: 1,
    previewBadge: 'Nível 1 · Inicial',
    description: 'Faixa elástica escura minimalista em tecido dry-fit de alta compressão.',
    unlockHint: 'Disponível no nível 1.',
  },
  {
    id: 'headband_purple_pro',
    name: 'Faixa Pro Lilás Dupla',
    slot: 'headband',
    category: 'headband',
    categoryLabel: 'Faixas Esportivas',
    slotLabel: 'Faixa',
    rarity: 'rare',
    requiredLevel: 2,
    requiredAchievementId: 'first_workout',
    previewBadge: '1º Treino Concluído',
    description: 'Faixa dupla esportiva com listra central reflexiva para treinos intensos.',
    unlockHint: 'Conclua seu 1º treino completo no aplicativo.',
  },
  {
    id: 'headband_neon_purple',
    name: 'Faixa Glow Violeta Pulsante',
    slot: 'headband',
    category: 'headband',
    categoryLabel: 'Faixas Esportivas',
    slotLabel: 'Faixa Glow',
    rarity: 'epic',
    requiredLevel: 4,
    previewBadge: 'Nível 4 · Épico',
    description: 'Polímero elástico tecnológico com iluminação neon violeta radiante.',
    unlockHint: 'Alcance o Nível 4 de consistência.',
  },
  {
    id: 'headband_golden_champion',
    name: 'Faixa Ouro de Campeão',
    slot: 'headband',
    category: 'headband',
    categoryLabel: 'Faixas Esportivas',
    slotLabel: 'Faixa Ouro',
    rarity: 'legendary',
    requiredLevel: 7,
    previewBadge: 'Nível 7 · Lendário',
    description: 'Bordada com fios de ouro reluzentes e louros de vitória na fronte.',
    unlockHint: 'Alcance o Nível 7 de consistência.',
  },

  // 5. ROUPAS E UNIFORMES (outfit)
  {
    id: 'outfit_classic',
    name: 'Regata P Oficial PomboFit',
    slot: 'outfit',
    category: 'outfit',
    categoryLabel: 'Roupas e Uniformes',
    slotLabel: 'Regata',
    rarity: 'common',
    requiredLevel: 1,
    previewBadge: 'Padrão Oficial',
    description: 'Regata esportiva branca e roxa com corte cavado e logotipo P no peitoral.',
    unlockHint: 'Uniforme oficial de fábrica do mascote.',
  },
  {
    id: 'outfit_hooded_tank',
    name: 'Regata Cavada com Capuz Lilás',
    slot: 'outfit',
    category: 'outfit',
    categoryLabel: 'Roupas e Uniformes',
    slotLabel: 'Regata Capuz',
    rarity: 'rare',
    requiredLevel: 1,
    previewBadge: 'Nível 1 · Inicial',
    description: 'Corte cavado estilo fisiculturista americano com capuz relaxado nas costas.',
    unlockHint: 'Disponível no nível 1.',
  },
  {
    id: 'outfit_stealth_compression',
    name: 'Camisa de Compressão Stealth Black',
    slot: 'outfit',
    category: 'outfit',
    categoryLabel: 'Roupas e Uniformes',
    slotLabel: 'Compressão',
    rarity: 'rare',
    requiredLevel: 1,
    previewBadge: 'Nível 1 · Inicial',
    description: 'Tecido de alta compressão térmico preto fosco destacando o peitoral e deltoides.',
    unlockHint: 'Disponível no nível 1.',
  },
  {
    id: 'outfit_elite_white',
    name: 'Traje Olímpico Branco & Grafite',
    slot: 'outfit',
    category: 'outfit',
    categoryLabel: 'Roupas e Uniformes',
    slotLabel: 'Traje Olímpico',
    rarity: 'epic',
    requiredLevel: 4,
    requiredAchievementId: 'first_week_goal',
    previewBadge: 'Meta Semanal Conquistada',
    description: 'Corte anatômico de alta performance com costuras seladas a laser e brasão.',
    unlockHint: 'Atinja 100% da sua meta semanal de treinos.',
  },
  {
    id: 'outfit_royal_gold',
    name: 'Armadura Mestre Consistente',
    slot: 'outfit',
    category: 'outfit',
    categoryLabel: 'Roupas e Uniformes',
    slotLabel: 'Armadura Mestre',
    rarity: 'legendary',
    requiredLevel: 6,
    requiredAchievementId: 'thirty_days_consistency',
    previewBadge: '30 Dias de Consistência',
    description: 'Edição de honra com ombreiras douradas e tecidos blindados para quem nunca desiste.',
    unlockHint: 'Mantenha 30 dias de treinos ativos com disciplina.',
  },
  {
    id: 'outfit_cyber_suit',
    name: 'Exotraje Nano-Titanium',
    slot: 'outfit',
    category: 'outfit',
    categoryLabel: 'Roupas e Uniformes',
    slotLabel: 'Exotraje',
    rarity: 'legendary',
    requiredLevel: 8,
    previewBadge: 'Nível 8 · Lendário',
    description: 'Placas biomecânicas de nanotitânio com circuitos de energia violeta.',
    unlockHint: 'Alcance o Nível 8 de consistência.',
  },

  // 6. ACESSÓRIOS ESPECIAIS (special)
  {
    id: 'acc_wristwraps_pro',
    name: 'Munhequeiras & Faixas de Punho Pro',
    slot: 'special',
    category: 'special',
    categoryLabel: 'Acessórios Especiais',
    slotLabel: 'Munhequeira',
    rarity: 'rare',
    requiredLevel: 3,
    requiredAchievementId: 'first_pr',
    previewBadge: '1º Recorde Pessoal',
    description: 'Munhequeiras elásticas de alta densidade para suporte nas cargas máximas.',
    unlockHint: 'Bata seu primeiro recorde pessoal de carga (PR).',
  },
  {
    id: 'acc_shaker_purple',
    name: 'Coqueteleira Térmica 1L PomboFit',
    slot: 'special',
    category: 'special',
    categoryLabel: 'Acessórios Especiais',
    slotLabel: 'Coqueteleira',
    rarity: 'common',
    requiredLevel: 2,
    requiredAchievementId: 'hydration_master',
    previewBadge: 'Meta de Água Batida',
    description: 'Garrafa térmica metálica roxa de 1000ml com misturador de whey e água.',
    unlockHint: 'Bata sua meta de hidratação diária no módulo de Hábitos.',
  },
  {
    id: 'special_powerlifting_belt',
    name: 'Cinto de Couro Powerlifting 13mm',
    slot: 'special',
    category: 'special',
    categoryLabel: 'Acessórios Especiais',
    slotLabel: 'Cinto de Força',
    rarity: 'rare',
    requiredLevel: 4,
    previewBadge: 'Nível 4',
    description: 'Cinto de couro legítimo com fivela de alavanca de aço escovado para sustentação de core.',
    unlockHint: 'Alcance o Nível 4 de consistência.',
  },
  {
    id: 'special_titanium_chain',
    name: 'Corrente de Aço Cubana 18k',
    slot: 'special',
    category: 'special',
    categoryLabel: 'Acessórios Especiais',
    slotLabel: 'Corrente',
    rarity: 'rare',
    requiredLevel: 4,
    previewBadge: 'Nível 4',
    description: 'Corrente cubana pesada com banho dourado reluzente sobre o peito musculoso.',
    unlockHint: 'Alcance o Nível 4 de consistência.',
  },
  {
    id: 'special_gold_medal',
    name: 'Medalha Maciça Ouro PomboFit',
    slot: 'special',
    category: 'special',
    categoryLabel: 'Acessórios Especiais',
    slotLabel: 'Medalha',
    rarity: 'epic',
    requiredLevel: 5,
    previewBadge: 'Nível 5 · Épico',
    description: 'Medalha de primeiro lugar em ouro fundido com fita roxa aveludada.',
    unlockHint: 'Alcance o Nível 5 de consistência.',
  },
  {
    id: 'special_super_aura',
    name: 'Aura de Energia Super Pombo',
    slot: 'special',
    category: 'special',
    categoryLabel: 'Acessórios Especiais',
    slotLabel: 'Aura Cósmica',
    rarity: 'legendary',
    requiredLevel: 10,
    previewBadge: 'Nível 10 · Lendário',
    description: 'Ondas flamejantes de energia mística roxa e centelhas pulsando ao redor do Pombo.',
    unlockHint: 'Alcance o Nível 10 de consistência máxima.',
  },

  // Legacy compatibility accessories
  {
    id: 'shoes_classic',
    name: 'Tênis Training Roxo',
    slot: 'shoes',
    category: 'special',
    categoryLabel: 'Acessórios Especiais',
    slotLabel: 'Tênis',
    rarity: 'common',
    requiredLevel: 1,
    previewBadge: 'Padrão Oficial',
    description: 'Solado estável para treinos de musculação e cardio.',
    unlockHint: 'Disponível no nível 1.',
  },
  {
    id: 'shoes_speed_violet',
    name: 'Tênis Flat Grip Pro',
    slot: 'shoes',
    category: 'special',
    categoryLabel: 'Acessórios Especiais',
    slotLabel: 'Tênis',
    rarity: 'rare',
    requiredLevel: 2,
    requiredAchievementId: 'five_workouts',
    previewBadge: '5 Treinos',
    description: 'Aderência máxima para agachamentos e levantamento terra.',
    unlockHint: 'Complete 5 treinos no histórico.',
  },
  {
    id: 'pose_determined',
    name: 'Postura Determinada',
    slot: 'pose',
    category: 'special',
    categoryLabel: 'Acessórios Especiais',
    slotLabel: 'Pose',
    rarity: 'common',
    requiredLevel: 1,
    previewBadge: 'Padrão Oficial',
    description: 'Pose pronta para iniciar a sessão do dia.',
    unlockHint: 'Disponível no nível 1.',
  },
  {
    id: 'pose_double_biceps',
    name: 'Duplo Bíceps de Vitória',
    slot: 'pose',
    category: 'special',
    categoryLabel: 'Acessórios Especiais',
    slotLabel: 'Pose',
    rarity: 'epic',
    requiredLevel: 4,
    requiredAchievementId: 'ten_workouts',
    previewBadge: '10 Treinos',
    description: 'Pose clássica comemorando evolução de volume e força.',
    unlockHint: 'Complete 10 treinos no histórico.',
  },
];

export function calculateLevelFromXp(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  const xpPerLevel = 300;
  const level = Math.max(1, Math.floor(xp / xpPerLevel) + 1);
  const currentLevelXp = xp % xpPerLevel;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / xpPerLevel) * 100));
  return {
    level,
    currentLevelXp,
    nextLevelXp: xpPerLevel,
    progressPercent,
  };
}

export interface MuscleComboOption {
  id: string;
  label: string;
  shortDesc: string;
  muscles: MuscleCategory[];
}

export const MUSCLE_COMBO_OPTIONS: MuscleComboOption[] = [
  {
    id: 'peito_triceps',
    label: 'Peito e Tríceps',
    shortDesc: 'Sinergia clássica de empurrar e extensão de cotovelos',
    muscles: ['Peito', 'Tríceps'],
  },
  {
    id: 'costas_biceps',
    label: 'Costas e Bíceps',
    shortDesc: 'Dorsais completas e flexores de cotovelo',
    muscles: ['Costas', 'Bíceps'],
  },
  {
    id: 'ombros_abdomen',
    label: 'Ombros e Abdômen',
    shortDesc: 'Deltoides 3D e estabilização completa do core',
    muscles: ['Ombros', 'Abdômen'],
  },
  {
    id: 'pernas_completas',
    label: 'Pernas Completas',
    shortDesc: 'Quadríceps, posteriores, glúteos e panturrilhas',
    muscles: ['Quadríceps', 'Posteriores de coxa', 'Glúteos', 'Panturrilhas'],
  },
  {
    id: 'quadriceps_panturrilhas',
    label: 'Quadríceps e Panturrilhas',
    shortDesc: 'Foco anterior de membros inferiores e panturrilhas',
    muscles: ['Quadríceps', 'Panturrilhas'],
  },
  {
    id: 'posterior_gluteos',
    label: 'Posterior de Coxa e Glúteos',
    shortDesc: 'Cadeia posterior de membros inferiores e quadril',
    muscles: ['Posteriores de coxa', 'Glúteos'],
  },
  {
    id: 'peito_costas',
    label: 'Peito e Costas (Antagonistas)',
    shortDesc: 'Alto volume de tronco com super-séries ou alternância',
    muscles: ['Peito', 'Costas'],
  },
  {
    id: 'biceps_triceps',
    label: 'Bíceps e Tríceps (Braços)',
    shortDesc: 'Sessão dedicada ao desenvolvimento de braços e antebraços',
    muscles: ['Bíceps', 'Tríceps', 'Antebraços'],
  },
];

export interface WorkoutSplitOptionInfo {
  id: WorkoutSplitType;
  category: WorkoutSplitCategory;
  title: string;
  subtitle: string;
  sheetsCount: number;
  idealMinDays: number;
  idealMaxDays: number;
  recommendedFor: string;
}

export const WORKOUT_SPLITS_CATALOG: WorkoutSplitOptionInfo[] = [
  {
    id: 'ai_auto',
    category: 'ai_auto',
    title: 'Não sei, deixe a IA decidir por mim',
    subtitle: 'A IA analisa objetivo, frequência, tempo, nível e recuperação para escolher a melhor divisão.',
    sheetsCount: 0,
    idealMinDays: 1,
    idealMaxDays: 7,
    recommendedFor: 'Recomendado para máxima eficiência',
  },
  {
    id: 'AB',
    category: 'letters',
    title: 'AB (Treino A e B)',
    subtitle: 'Duas fichas alternadas (ex: Superiores / Inferiores ou Empurrar+Anterior / Puxar+Posterior).',
    sheetsCount: 2,
    idealMinDays: 2,
    idealMaxDays: 4,
    recommendedFor: 'Ideal para 2 a 4 dias/semana',
  },
  {
    id: 'ABC',
    category: 'letters',
    title: 'ABC (Treino A, B e C)',
    subtitle: 'Três fichas equilibradas para cobrir todo o corpo com excelente recuperação.',
    sheetsCount: 3,
    idealMinDays: 3,
    idealMaxDays: 6,
    recommendedFor: 'Ideal para 3, 5 ou 6 dias/semana',
  },
  {
    id: 'ABCD',
    category: 'letters',
    title: 'ABCD (Treino A, B, C e D)',
    subtitle: 'Quatro fichas com maior atenção por grupamento muscular e separação de ombros/core.',
    sheetsCount: 4,
    idealMinDays: 4,
    idealMaxDays: 5,
    recommendedFor: 'Ideal para 4 a 5 dias/semana',
  },
  {
    id: 'ABCDE',
    category: 'letters',
    title: 'ABCDE (Treino A, B, C, D e E)',
    subtitle: 'Cinco fichas com foco dedicado por região muscular e separação de anterior/posterior de pernas.',
    sheetsCount: 5,
    idealMinDays: 5,
    idealMaxDays: 6,
    recommendedFor: 'Ideal para 5 dias/semana',
  },
  {
    id: 'ABCDEF',
    category: 'letters',
    title: 'ABCDEF (Treino A, B, C, D, E e F)',
    subtitle: 'Seis fichas especializadas para praticantes com alta frequência semanal.',
    sheetsCount: 6,
    idealMinDays: 6,
    idealMaxDays: 7,
    recommendedFor: 'Ideal para 6 dias/semana',
  },
  {
    id: 'full_body',
    category: 'modality',
    title: 'Treino Full Body (Corpo Inteiro)',
    subtitle: 'Estímulo global em cada sessão com alta frequência semanal por músculo e ótimo gasto calórico.',
    sheetsCount: 2,
    idealMinDays: 2,
    idealMaxDays: 4,
    recommendedFor: 'Excelente para 2 a 3 dias/semana ou Emagrecimento',
  },
  {
    id: 'upper_lower',
    category: 'modality',
    title: 'Upper / Lower (Superiores e Inferiores)',
    subtitle: 'Alternância entre tronco completo e membros inferiores para equilíbrio de força e hipertrofia.',
    sheetsCount: 4,
    idealMinDays: 3,
    idealMaxDays: 5,
    recommendedFor: 'Excelente para 4 dias/semana',
  },
  {
    id: 'push_pull_legs',
    category: 'modality',
    title: 'Push / Pull / Legs (Empurrar, Puxar e Pernas)',
    subtitle: 'Divisão biomecânica clássica por padrões de movimento sinérgicos.',
    sheetsCount: 3,
    idealMinDays: 3,
    idealMaxDays: 6,
    recommendedFor: 'Excelente para 3 a 6 dias/semana',
  },
  {
    id: 'muscle_groups',
    category: 'muscle_groups',
    title: 'Divisão por Grupos Musculares',
    subtitle: 'Monte sua própria combinação escolhendo quais duplas ou grupos musculares deseja treinar.',
    sheetsCount: 3,
    idealMinDays: 2,
    idealMaxDays: 6,
    recommendedFor: 'Personalizado conforme sua preferência',
  },
];

export interface SplitCompatibilityResult {
  isCompatible: boolean;
  severity: 'ok' | 'warning';
  title: string;
  explanation: string;
  suggestedSplitType: WorkoutSplitType;
  suggestedSplitLabel: string;
  suggestedWeeklyDays: number;
  adaptationNote: string;
}

export function recommendOptimalSplit(profile: Partial<UserProfile>): {
  splitType: Exclude<WorkoutSplitType, 'ai_auto'>;
  reason: string;
} {
  const days = profile.weeklyDays || 4;
  const level = profile.experienceLevel || 'intermediate';
  const goal = profile.goal || 'gain_muscle';

  if (days <= 2) {
    return {
      splitType: 'full_body',
      reason: `Para ${days} dias na semana, o Full Body estimula todos os grandes grupos musculares duas vezes na semana sem deixar músculos longos períodos sem treino.`,
    };
  }
  if (days === 3) {
    if (level === 'beginner' || goal === 'lose_weight') {
      return {
        splitType: 'AB',
        reason: 'Para 3 dias semanais com foco em evolução consistente e gasto metabólico, a divisão AB rotativa garante estímulo frequente e ótima recuperação.',
      };
    }
    return {
      splitType: 'push_pull_legs',
      reason: 'Para 3 dias na semana, Push / Pull / Legs organiza perfeitamente padrões de Empurrar, Puxar e Pernas sem sobreposição articular.',
    };
  }
  if (days === 4) {
    if (goal === 'get_strong' || level === 'beginner') {
      return {
        splitType: 'upper_lower',
        reason: 'Em 4 dias semanais, Upper / Lower permite trabalhar cada grupo 2x na semana com foco em progressão de carga e recuperação ideal.',
      };
    }
    return {
      splitType: 'ABCD',
      reason: 'Para 4 dias semanais focados em hipertrofia, a divisão ABCD distribui o volume com precisão entre tronco, ombros e membros inferiores.',
    };
  }
  if (days === 5) {
    if (level === 'advanced' && goal === 'gain_muscle') {
      return {
        splitType: 'ABCDE',
        reason: 'Com 5 dias disponíveis e nível avançado, o ABCDE permite alto volume direcionado para cada grupo muscular com foco nos seus pontos prioritários.',
      };
    }
    return {
      splitType: 'ABC',
      reason: 'Com 5 dias na semana, a divisão ABC rotativa combina volume moderado por sessão com maior frequência semanal de estímulo muscular.',
    };
  }
  // 6 or 7 days
  if (level === 'advanced' && goal === 'gain_muscle') {
    return {
      splitType: 'ABCDEF',
      reason: 'Para 6 dias semanais no nível avançado, a divisão ABCDEF separa anterior e posterior de coxa, costas, peito, ombros e braços com máxima especificidade.',
    };
  }
  return {
    splitType: 'push_pull_legs',
    reason: 'Para 6 dias na semana, Push / Pull / Legs 2x oferece a melhor relação entre frequência (2x por músculo) e recuperação articular.',
  };
}

export function checkSplitCompatibility(
  splitType: WorkoutSplitType,
  weeklyDays: number,
  customCombos: string[] = [],
  profile?: Partial<UserProfile>
): SplitCompatibilityResult {
  const recommended = recommendOptimalSplit({ ...profile, weeklyDays });
  const recInfo = WORKOUT_SPLITS_CATALOG.find((s) => s.id === recommended.splitType);

  if (splitType === 'ai_auto') {
    return {
      isCompatible: true,
      severity: 'ok',
      title: `Recomendação da IA: ${recInfo?.title || recommended.splitType}`,
      explanation: recommended.reason,
      suggestedSplitType: recommended.splitType,
      suggestedSplitLabel: recInfo?.title || recommended.splitType,
      suggestedWeeklyDays: weeklyDays,
      adaptationNote: 'A IA ajustará automaticamente séries, exercícios e descansos ao seu perfil.',
    };
  }

  if (splitType === 'muscle_groups') {
    const count = customCombos.length;
    if (count === 0) {
      return {
        isCompatible: false,
        severity: 'warning',
        title: 'Selecione pelo menos 2 combinações musculares',
        explanation: 'Para montar sua divisão por grupos musculares, escolha ao menos 2 combinações da lista.',
        suggestedSplitType: recommended.splitType,
        suggestedSplitLabel: recInfo?.title || recommended.splitType,
        suggestedWeeklyDays: weeklyDays,
        adaptationNote: 'Você também pode deixar a IA escolher a divisão ideal.',
      };
    }
    if (count > weeklyDays + 1) {
      return {
        isCompatible: false,
        severity: 'warning',
        title: `Atenção: ${count} fichas para apenas ${weeklyDays} dias na semana`,
        explanation: `Você selecionou ${count} combinações de grupos musculares, mas informou que treina ${weeklyDays}x por semana. Isso fará com que alguns músculos demorem mais de 10 dias para receber novo estímulo.`,
        suggestedSplitType: recommended.splitType,
        suggestedSplitLabel: recInfo?.title || recommended.splitType,
        suggestedWeeklyDays: Math.min(6, count),
        adaptationNote: `Sugerimos reduzir para ${weeklyDays} combinações, aumentar sua frequência para ${Math.min(6, count)} dias/semana ou confirmar o ciclo rotativo.`,
      };
    }
    return {
      isCompatible: true,
      severity: 'ok',
      title: 'Divisão personalizada compatível',
      explanation: `Suas ${count} fichas personalizadas serão organizadas de acordo com seus ${weeklyDays} dias semanais.`,
      suggestedSplitType: 'muscle_groups',
      suggestedSplitLabel: 'Divisão por Grupos Musculares',
      suggestedWeeklyDays: weeklyDays,
      adaptationNote: 'Distribuição equilibrada confirmada.',
    };
  }

  const splitInfo = WORKOUT_SPLITS_CATALOG.find((s) => s.id === splitType);
  if (!splitInfo) {
    return {
      isCompatible: true,
      severity: 'ok',
      title: 'Divisão compatível',
      explanation: recommended.reason,
      suggestedSplitType: recommended.splitType,
      suggestedSplitLabel: recInfo?.title || recommended.splitType,
      suggestedWeeklyDays: weeklyDays,
      adaptationNote: '',
    };
  }

  // Check if sheetsCount > weeklyDays (e.g. ABCD/ABCDE/ABCDEF with fewer days)
  if (splitInfo.sheetsCount > weeklyDays) {
    return {
      isCompatible: false,
      severity: 'warning',
      title: `Incompatibilidade detectada: ${splitInfo.title} com ${weeklyDays} dias/semana`,
      explanation: `A divisão ${splitInfo.title} possui ${splitInfo.sheetsCount} fichas diferentes, mas você informou ${weeklyDays} dias disponíveis por semana. Na prática, cada grupo muscular será treinado menos de 1 vez por semana, reduzindo seus resultados.`,
      suggestedSplitType: recommended.splitType,
      suggestedSplitLabel: recInfo?.title || recommended.splitType,
      suggestedWeeklyDays: splitInfo.idealMinDays,
      adaptationNote: `Recomendamos mudar para "${recInfo?.title}" (ideal para ${weeklyDays} dias) ou ajustar sua disponibilidade para ${splitInfo.idealMinDays} dias/semana. Se preferir manter ${splitInfo.title}, aplicaremos um calendário rotativo contínuo.`,
    };
  }

  // Check if Full Body is selected for 5-6 days/week
  if (splitType === 'full_body' && weeklyDays >= 5) {
    return {
      isCompatible: false,
      severity: 'warning',
      title: `Atenção à recuperação: Full Body em ${weeklyDays} dias/semana`,
      explanation: `Treinar o corpo inteiro ${weeklyDays} vezes na semana sem dias intercalados de descanso pode gerar fadiga articular e prejudicar a recuperação muscular.`,
      suggestedSplitType: recommended.splitType,
      suggestedSplitLabel: recInfo?.title || recommended.splitType,
      suggestedWeeklyDays: 3,
      adaptationNote: `Para ${weeklyDays} dias na semana, sugerimos "${recInfo?.title}" para garantir 48h de recuperação por grupo muscular.`,
    };
  }

  return {
    isCompatible: true,
    severity: 'ok',
    title: `${splitInfo.title} é compatível com ${weeklyDays} dias/semana`,
    explanation: `Ótima escolha! Essa organização permite distribuir o volume semanal e recuperar adequadamente cada grupo muscular.`,
    suggestedSplitType: splitType,
    suggestedSplitLabel: splitInfo.title,
    suggestedWeeklyDays: weeklyDays,
    adaptationNote: '',
  };
}

/**
 * Generates genuinely individualized workout sheets for each user based on their
 * complete profile: goal, age, weightKg, heightCm, experienceLevel, weeklyDays,
 * sessionDurationMin, availableEquipment, priorityMuscles, limitations, and chosen split.
 * Never returns a static developer sheet.
 */
export function generatePersonalizedWorkouts(
  profile: UserProfile,
  allExercises: ExerciseItem[]
): Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>[] {
  const limText = (profile.limitations || '').toLowerCase();
  const avoidShoulder = limText.includes('ombro') || limText.includes('manguito') || limText.includes('bursite');
  const avoidKnee = limText.includes('joelho') || limText.includes('menisco') || limText.includes('patela') || limText.includes('condromalacia');
  const avoidLowerBack = limText.includes('lombar') || limText.includes('coluna') || limText.includes('hérnia') || limText.includes('hernia') || limText.includes('escoliose');
  const avoidWrist = limText.includes('punho') || limText.includes('pulso') || limText.includes('tendinite');
  const avoidElbow = limText.includes('cotovelo') || limText.includes('epicondilite');
  const avoidImpact = limText.includes('impacto') || avoidKnee || (profile.age !== undefined && profile.age >= 58);

  const allowedEquip: EquipmentCategory[] =
    profile.availableEquipment && profile.availableEquipment.length > 0
      ? profile.availableEquipment
      : ['Máquinas', 'Halteres', 'Barras', 'Cabos', 'Peso corporal'];

  const safeExercises = allExercises.filter((ex) => {
    if (!allowedEquip.includes(ex.equipment) && ex.equipment !== 'Peso corporal') {
      return false;
    }
    if (avoidShoulder && ex.jointStressTags.includes('ombro')) return false;
    if (avoidKnee && ex.jointStressTags.includes('joelho')) return false;
    if (avoidLowerBack && ex.jointStressTags.includes('lombar')) return false;
    if (avoidWrist && ex.jointStressTags.includes('punho')) return false;
    if (avoidElbow && ex.jointStressTags.includes('cotovelo')) return false;
    if (avoidImpact && ex.jointStressTags.includes('impacto')) return false;
    return true;
  });

  // Score exercises individually according to user's experience, goal, age, and equipment preference
  const scoreExerciseForUser = (ex: ExerciseItem, indexSeed: number): number => {
    let score = 50;

    // Experience level & age biomechanics
    if (profile.experienceLevel === 'beginner' || (profile.age && profile.age >= 55)) {
      if (ex.equipment === 'Máquinas' || ex.equipment === 'Cabos') score += 25;
      if (ex.equipment === 'Barras' && ex.jointStressTags.length > 1) score -= 15;
    } else if (profile.experienceLevel === 'advanced') {
      if (ex.equipment === 'Barras' || ex.equipment === 'Halteres' || ex.equipment === 'Cabos') score += 20;
    } else {
      // intermediate
      if (ex.equipment === 'Halteres' || ex.equipment === 'Máquinas' || ex.equipment === 'Cabos') score += 18;
    }

    // Goal-specific movement pattern preference
    if (profile.goal === 'get_strong') {
      if (
        ex.movementType === 'Empurrar' ||
        ex.movementType === 'Puxar' ||
        ex.movementType === 'Agachar' ||
        ex.movementType === 'Dobradiça de quadril'
      ) {
        score += 30;
      }
      if (ex.equipment === 'Barras' || ex.equipment === 'Halteres') score += 15;
    } else if (profile.goal === 'lose_weight') {
      if (
        ex.movementType === 'Agachar' ||
        ex.movementType === 'Empurrar' ||
        ex.movementType === 'Puxar' ||
        ex.movementType === 'Cardio / Metabólico' ||
        ex.movementType === 'Core / Estabilização'
      ) {
        score += 22;
      }
    } else if (profile.goal === 'gain_muscle') {
      // Hypertrophy: balance compounds and isolations
      if (ex.movementType !== 'Cardio / Metabólico') score += 20;
    }

    // Priority muscles boost
    if (profile.priorityMuscles && profile.priorityMuscles.includes(ex.muscleGroup)) {
      score += 18;
    }

    // Deterministic tie-breaker using user profile parameters so different profiles pick varied exercises
    const profileHash =
      (profile.age || 28) * 3 +
      Math.round(profile.weightKg || 72) * 5 +
      Math.round(profile.heightCm || 172) +
      (profile.sessionDurationMin || 60) +
      indexSeed * 7;
    const idCharSum = ex.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    score += (idCharSum + profileHash) % 14;

    return score;
  };

  const usedExerciseIds = new Set<string>();

  const pickByMuscle = (muscle: MuscleCategory, count: number, allowReuse = false): ExerciseItem[] => {
    if (count <= 0) return [];
    let pool = safeExercises.filter((e) => e.muscleGroup === muscle && (allowReuse || !usedExerciseIds.has(e.id)));
    if (pool.length < count) {
      pool = safeExercises.filter((e) => e.muscleGroup === muscle);
    }
    if (pool.length < count) {
      pool = allExercises.filter((e) => e.muscleGroup === muscle);
    }

    const ranked = [...pool].sort((a, b) => scoreExerciseForUser(b, count) - scoreExerciseForUser(a, count));
    const chosen = ranked.slice(0, count);
    chosen.forEach((c) => usedExerciseIds.add(c.id));
    return chosen;
  };

  // Determine target exercises per workout based on sessionDurationMin
  const durationMin = profile.sessionDurationMin || 60;
  const targetExercisesPerSession =
    durationMin <= 35 ? 4 : durationMin <= 50 ? 5 : durationMin <= 65 ? 6 : 7;

  // Estimate initial suggested load based on weightKg, experienceLevel, and goal
  const estimateSuggestedWeight = (ex: ExerciseItem): number | undefined => {
    if (ex.equipment === 'Peso corporal' || ex.muscleGroup === 'Cardio' || ex.muscleGroup === 'Abdômen') {
      return undefined;
    }
    const bodyWeight = profile.weightKg || 70;
    const expMult =
      profile.experienceLevel === 'advanced' ? 0.45 : profile.experienceLevel === 'intermediate' ? 0.32 : 0.2;
    const isLowerBody =
      ex.muscleGroup === 'Quadríceps' || ex.muscleGroup === 'Posteriores de coxa' || ex.muscleGroup === 'Glúteos';
    const isSmallMuscle =
      ex.muscleGroup === 'Bíceps' || ex.muscleGroup === 'Tríceps' || ex.muscleGroup === 'Ombros' || ex.muscleGroup === 'Antebraços';

    let base = bodyWeight * expMult;
    if (isLowerBody) base *= 1.35;
    if (isSmallMuscle) base *= 0.42;
    if (ex.equipment === 'Halteres') base *= 0.45; // per dumbbell

    return Math.max(4, Math.round(base / 2) * 2);
  };

  const priorities = new Set<MuscleCategory>(profile.priorityMuscles || []);

  const toSlots = (items: ExerciseItem[], sheetIndex: number) =>
    items.map((item, idx) => {
      const isPriority = priorities.has(item.muscleGroup);
      const isCompound =
        item.movementType === 'Empurrar' ||
        item.movementType === 'Puxar' ||
        item.movementType === 'Agachar' ||
        item.movementType === 'Dobradiça de quadril';

      let sets = profile.experienceLevel === 'beginner' ? 3 : 4;
      if (isPriority && profile.experienceLevel !== 'beginner') {
        sets = 4;
      } else if (!isPriority && !isCompound && durationMin <= 45) {
        sets = 3;
      }

      let reps = '10-12';
      let restSeconds = 75;
      let goalNotePrefix = '';

      if (item.muscleGroup === 'Cardio') {
        sets = 1;
        reps = profile.goal === 'lose_weight' ? '15-20 min' : '10-12 min';
        restSeconds = 30;
        goalNotePrefix = 'Ritmo contínuo moderado/intenso. ';
      } else if (profile.goal === 'get_strong') {
        reps = isCompound ? '5-6' : '8-10';
        restSeconds = isCompound ? 120 : 90;
        goalNotePrefix = isCompound
          ? 'Foco em progressão de carga com core firme. '
          : 'Controle total da estabilidade articular. ';
      } else if (profile.goal === 'gain_muscle') {
        reps = isCompound ? '8-10' : '10-12';
        restSeconds = isCompound ? 90 : 60;
        goalNotePrefix = 'Cadência controlada na descida (2-3s) e amplitude máxima. ';
      } else {
        // lose_weight
        reps = isCompound ? '12-15' : '15';
        restSeconds = 45;
        goalNotePrefix = 'Mantenha ritmo dinâmico e intervalo curto para gasto metabólico. ';
      }

      return {
        id: `slot_${sheetIndex}_${item.id}_${idx}`,
        exerciseId: item.id,
        sets,
        reps,
        restSeconds,
        targetWeightKg: estimateSuggestedWeight(item),
        notes: `${goalNotePrefix}${item.importantNotes}`.slice(0, 120),
      };
    });

  // Helper to allocate muscle counts scaled to targetExercisesPerSession and user priorities
  const buildMuscleSelection = (muscles: MuscleCategory[], allowCardioFinisher = false): ExerciseItem[] => {
    const orderedMuscles = [...muscles].sort((a, b) => {
      const aPrio = priorities.has(a) ? 1 : 0;
      const bPrio = priorities.has(b) ? 1 : 0;
      return bPrio - aPrio;
    });

    const reserveForCardio =
      allowCardioFinisher && profile.goal === 'lose_weight' && !orderedMuscles.includes('Cardio') ? 1 : 0;
    const mainSlots = Math.max(orderedMuscles.length, targetExercisesPerSession - reserveForCardio);

    const counts = new Map<MuscleCategory, number>();
    orderedMuscles.forEach((m) => counts.set(m, 1));
    let remaining = mainSlots - orderedMuscles.length;
    let cursor = 0;
    while (remaining > 0 && orderedMuscles.length > 0) {
      const m = orderedMuscles[cursor % orderedMuscles.length];
      counts.set(m, (counts.get(m) || 1) + 1);
      remaining--;
      cursor++;
    }

    const picked: ExerciseItem[] = [];
    orderedMuscles.forEach((m) => {
      picked.push(...pickByMuscle(m, counts.get(m) || 1));
    });

    if (reserveForCardio > 0) {
      picked.push(...pickByMuscle('Cardio', 1, true));
    }

    return picked;
  };

  // Resolve active split
  const resolvedSplit: Exclude<WorkoutSplitType, 'ai_auto'> =
    !profile.workoutSplitType || profile.workoutSplitType === 'ai_auto'
      ? recommendOptimalSplit(profile).splitType
      : profile.workoutSplitType;

  // Build templates per split
  interface SheetBlueprint {
    name: string;
    description: string;
    muscles: MuscleCategory[];
  }

  let blueprints: SheetBlueprint[] = [];

  if (resolvedSplit === 'muscle_groups' && profile.customMuscleCombos && profile.customMuscleCombos.length > 0) {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    blueprints = profile.customMuscleCombos
      .map((comboId, idx) => {
        const combo = MUSCLE_COMBO_OPTIONS.find((c) => c.id === comboId);
        if (!combo) return null;
        return {
          name: `Treino ${letters[idx] || idx + 1} — ${combo.label}`,
          description: `${combo.shortDesc} • Ajustado para ${MASCOT_DATA[goalToMascotForm(profile.goal)].goalLabel}.`,
          muscles: combo.muscles,
        };
      })
      .filter((b): b is SheetBlueprint => b !== null);
  }

  if (blueprints.length === 0) {
    switch (resolvedSplit) {
      case 'full_body':
        blueprints = [
          {
            name: 'Full Body A — Ênfase Cadeia Anterior & Empurrar',
            description: 'Estímulo global de corpo inteiro com foco em quadríceps, peitoral, dorsais, ombros e core.',
            muscles: ['Quadríceps', 'Peito', 'Costas', 'Ombros', 'Abdômen'],
          },
          {
            name: 'Full Body B — Ênfase Cadeia Posterior & Puxar',
            description: 'Estímulo global de corpo inteiro com foco em posteriores, glúteos, costas, peito e braços.',
            muscles: ['Posteriores de coxa', 'Glúteos', 'Costas', 'Peito', 'Bíceps', 'Tríceps'],
          },
        ];
        break;

      case 'AB':
        blueprints = [
          {
            name: 'Treino A — Superiores Completo (Tronco & Braços)',
            description: 'Desenvolvimento integrado de peitoral, costas, ombros, bíceps e tríceps.',
            muscles: ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps'],
          },
          {
            name: 'Treino B — Inferiores Completo & Core',
            description: 'Força e definição para quadríceps, posteriores de coxa, glúteos, panturrilhas e abdômen.',
            muscles: ['Quadríceps', 'Posteriores de coxa', 'Glúteos', 'Panturrilhas', 'Abdômen'],
          },
        ];
        break;

      case 'upper_lower':
        blueprints = [
          {
            name: 'Upper A — Superiores (Foco Força & Densidade)',
            description: 'Movimentos multiarticulares para peitoral, dorsais, deltoides e braços.',
            muscles: ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps'],
          },
          {
            name: 'Lower A — Inferiores (Foco Quadríceps & Core)',
            description: 'Ênfase em agachamento/extensão de joelhos, glúteos, panturrilhas e estabilidade abdominal.',
            muscles: ['Quadríceps', 'Glúteos', 'Panturrilhas', 'Abdômen'],
          },
          {
            name: 'Upper B — Superiores (Foco Hipertrofia & Ângulos)',
            description: 'Variação biomecânica de estímulos para costas, peito, deltoides laterais/posteriores e braços.',
            muscles: ['Costas', 'Peito', 'Ombros', 'Tríceps', 'Bíceps'],
          },
          {
            name: 'Lower B — Inferiores (Foco Posterior & Glúteos)',
            description: 'Ênfase em cadeia posterior, isquiotibiais, extensão de quadril e panturrilhas.',
            muscles: ['Posteriores de coxa', 'Glúteos', 'Quadríceps', 'Panturrilhas'],
          },
        ];
        break;

      case 'ABCD':
        blueprints = [
          {
            name: 'Treino A — Peito e Tríceps',
            description: 'Sinergia de empurrar com foco em peitoral superior/médio e tríceps completo.',
            muscles: ['Peito', 'Tríceps'],
          },
          {
            name: 'Treino B — Costas e Bíceps',
            description: 'Puxadas verticais e remadas para expansão dorsal, trapézio e bíceps.',
            muscles: ['Costas', 'Bíceps', 'Antebraços'],
          },
          {
            name: 'Treino C — Pernas Completo & Glúteos',
            description: 'Trabalho estruturado para quadríceps, posteriores, glúteos e panturrilhas.',
            muscles: ['Quadríceps', 'Posteriores de coxa', 'Glúteos', 'Panturrilhas'],
          },
          {
            name: 'Treino D — Ombros Completo e Abdômen',
            description: 'Desenvolvimento das três porções do deltoide e fortalecimento profundo do core.',
            muscles: ['Ombros', 'Abdômen'],
          },
        ];
        break;

      case 'ABCDE':
        blueprints = [
          {
            name: 'Treino A — Peito e Abdômen',
            description: 'Volume dedicado ao peitoral em múltiplos ângulos e estabilização abdominal.',
            muscles: ['Peito', 'Abdômen'],
          },
          {
            name: 'Treino B — Costas Completo e Antebraços',
            description: 'Densidade e largura dorsal com foco em remadas e puxadas.',
            muscles: ['Costas', 'Antebraços'],
          },
          {
            name: 'Treino C — Quadríceps e Panturrilhas',
            description: 'Sessão focada na cadeia anterior de membros inferiores e panturrilhas.',
            muscles: ['Quadríceps', 'Panturrilhas'],
          },
          {
            name: 'Treino D — Ombros Completo e Tríceps',
            description: 'Desenvolvimento de deltoides frontal, lateral, posterior e tríceps.',
            muscles: ['Ombros', 'Tríceps'],
          },
          {
            name: 'Treino E — Posterior de Coxa, Glúteos e Bíceps',
            description: 'Foco em cadeia posterior de pernas, glúteos e flexores de cotovelo.',
            muscles: ['Posteriores de coxa', 'Glúteos', 'Bíceps'],
          },
        ];
        break;

      case 'ABCDEF':
        blueprints = [
          {
            name: 'Treino A — Peitoral Especializado',
            description: 'Estímulo completo para clavicular, esternal e inferior do peitoral.',
            muscles: ['Peito', 'Abdômen'],
          },
          {
            name: 'Treino B — Costas Especializado',
            description: 'Volume dedicado para grande dorsal, redondo maior e romboides.',
            muscles: ['Costas'],
          },
          {
            name: 'Treino C — Quadríceps e Panturrilhas',
            description: 'Ênfase máxima na porção anterior da coxa e panturrilhas.',
            muscles: ['Quadríceps', 'Panturrilhas'],
          },
          {
            name: 'Treino D — Ombros Completo',
            description: 'Trabalho tridimensional para deltoides anterior, lateral e posterior.',
            muscles: ['Ombros', 'Abdômen'],
          },
          {
            name: 'Treino E — Bíceps, Tríceps e Antebraços',
            description: 'Sessão exclusiva para hipertrofia e simetria de braços.',
            muscles: ['Bíceps', 'Tríceps', 'Antebraços'],
          },
          {
            name: 'Treino F — Posterior de Coxa e Glúteos',
            description: 'Especialização em isquiotibiais, glúteo máximo/médio e panturrilhas.',
            muscles: ['Posteriores de coxa', 'Glúteos', 'Panturrilhas'],
          },
        ];
        break;

      case 'push_pull_legs':
      case 'ABC':
      default: {
        const isPPL = resolvedSplit === 'push_pull_legs';
        blueprints = [
          {
            name: isPPL ? 'Push (Empurrar) — Peito, Ombros e Tríceps' : 'Treino A — Peito, Ombros e Tríceps',
            description: 'Sinergia biomecânica de empurrar com controle escapular e foco no seu objetivo.',
            muscles: ['Peito', 'Ombros', 'Tríceps'],
          },
          {
            name: isPPL ? 'Pull (Puxar) — Costas, Bíceps e Core' : 'Treino B — Costas, Bíceps e Abdômen',
            description: 'Padrões de puxada vertical/horizontal, bíceps e estabilidade do core.',
            muscles: ['Costas', 'Bíceps', 'Abdômen'],
          },
          {
            name: isPPL ? 'Legs (Pernas) — Inferiores Completo & Glúteos' : 'Treino C — Pernas Completo & Glúteos',
            description: 'Desenvolvimento equilibrado de quadríceps, posteriores, glúteos e panturrilhas.',
            muscles: ['Quadríceps', 'Posteriores de coxa', 'Glúteos', 'Panturrilhas'],
          },
        ];
        break;
      }
    }
  }

  // Distribute weekly days intelligently across the generated blueprints
  const weekDayPatterns: Record<number, string[]> = {
    1: ['Qua'],
    2: ['Ter', 'Qui'],
    3: ['Seg', 'Qua', 'Sex'],
    4: ['Seg', 'Ter', 'Qui', 'Sex'],
    5: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
    6: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    7: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
  };
  const activeWeekDays = weekDayPatterns[Math.min(7, Math.max(1, profile.weeklyDays || 4))] || weekDayPatterns[4];

  const sheetDays: string[][] = blueprints.map(() => []);
  activeWeekDays.forEach((day, dayIdx) => {
    sheetDays[dayIdx % blueprints.length].push(day);
  });

  return blueprints.map((bp, idx) => {
    const selectedExercises = buildMuscleSelection(bp.muscles, true);
    const finalMuscles = Array.from(new Set(selectedExercises.map((e) => e.muscleGroup)));
    return {
      userId: profile.userId,
      name: bp.name,
      description: bp.description,
      muscleGroups: finalMuscles.length > 0 ? finalMuscles : bp.muscles,
      scheduledDays: sheetDays[idx],
      estimatedDurationMin: durationMin,
      exercises: toSlots(selectedExercises, idx),
    };
  });
}
