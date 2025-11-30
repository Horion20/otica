export const fetchAddressByCep = async (cep: string) => {
  const cleanCep = cep.replace(/\D/g, '');
  
  if (cleanCep.length !== 8) {
    throw new Error('CEP inválido');
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();

    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    return {
      city: data.localidade,
      state: data.uf,
      street: data.logradouro,
      neighborhood: data.bairro
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw error;
  }
};