export const fonts = {
  fraunces: {
    light: 'Fraunces_300Light',
    medium: 'Fraunces_500Medium',
    semiBold: 'Fraunces_600SemiBold',
    bold: 'Fraunces_700Bold',
    italic: 'Fraunces_400Regular_Italic',
  },
  dmSans: {
    light: 'DMSans_300Light',
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    semiBold: 'DMSans_600SemiBold',
    bold: 'DMSans_700Bold',
  },
} as const;

export const textStyles = {
  display: { fontFamily: 'Fraunces_700Bold', fontSize: 26, lineHeight: 31 },
  h1: { fontFamily: 'Fraunces_600SemiBold', fontSize: 20, lineHeight: 26 },
  h2: { fontFamily: 'Fraunces_600SemiBold', fontSize: 17, lineHeight: 23 },
  h3: { fontFamily: 'DMSans_700Bold', fontSize: 14 },
  body: { fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 21 },
  label: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
} as const;
