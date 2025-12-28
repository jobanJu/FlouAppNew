import { Image, StyleSheet, View } from 'react-native';

const BulleProfilFlou = ({ imageUrl }) => {
  return (
    <View style={styles.container}>
      {/* COUCHE 1 : L'image de base, très floue */}
      <Image 
        source={{ uri: imageUrl }} 
        resizeMode="cover"
        style={styles.imageFloue} 
        blurRadius={70} /* Flou fort pour l'anonymat */
      />

      {/* COUCHE 2 : L'effet "Buée" par-dessus */}
      {/* C'est juste un voile blanc semi-transparent */}
      <View style={styles.coucheBuee} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    borderRadius: 40,    /* Rond */
    overflow: 'hidden',  /* Coupe tout ce qui dépasse */
    
    /* Optionnel : un bord très fin et gris, comme le bord d'un miroir embué */
    borderWidth: 1,
    borderColor: 'rgba(200,200,200, 0.3)', 
    backgroundColor: '#ccc', 
  },
  imageFloue: {
    width: '100%',
    height: '100%',
    /* On garde le zoom pour éviter les bords moches du flou */
    transform: [{ scale: 2 }], 
  },
  /* LE NOUVEAU STYLE CLÉ */
  coucheBuee: {
    ...StyleSheet.absoluteFillObject, /* Remplit tout le rond */
    backgroundColor: '#FFFFFF',       /* La couleur de la vapeur (blanc) */
    opacity: 1,                       /* Intensité maximale */
  }
});

export default BulleProfilFlou;