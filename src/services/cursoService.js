import { doc, setDoc, collection, addDoc, writeBatch, query, where, orderBy, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase.config';
import * as XLSX from 'xlsx';

/**
 * Fazer upload do arquivo Excel para o Storage
 */
export const uploadExcel = async (file, cursoId) => {
  try {
    const storageRef = ref(storage, `editais/${cursoId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    
    return {
      sucesso: true,
      url,
      nome: file.name
    };
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return {
      sucesso: false,
      erro: 'Erro ao fazer upload do arquivo'
    };
  }
};

/**
 * Processar arquivo Excel e extrair dados
 */
export const processarExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Pegar a primeira aba
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        resolve({
          sucesso: true,
          dados: jsonData,
          totalLinhas: jsonData.length
        });
      } catch (error) {
        console.error('Erro ao processar Excel:', error);
        reject({
          sucesso: false,
          erro: 'Erro ao processar arquivo Excel'
        });
      }
    };
    
    reader.onerror = () => {
      reject({
        sucesso: false,
        erro: 'Erro ao ler arquivo'
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Organizar dados do Excel por disciplina
 */
export const organizarPorDisciplina = (dados) => {
  const disciplinasMap = new Map();
  
  dados.forEach((linha, index) => {
    const disciplinaNome = linha['Disciplina'];
    
    if (!disciplinasMap.has(disciplinaNome)) {
      disciplinasMap.set(disciplinaNome, {
        nome: disciplinaNome,
        ordem: disciplinasMap.size + 1,
        assuntos: []
      });
    }
    
    const disciplina = disciplinasMap.get(disciplinaNome);
    disciplina.assuntos.push({
      titulo: linha['Assunto'],
      ordem: linha['Ordenação'] || index + 1,
      tempos: {
        paginasOuMinutos: linha['Páginas ou Minutos de Vídeo'] || 0,
        expresso: linha['Minutos Expresso'] || 0,
        regular: linha['Minutos Regular'] || 0,
        calma: linha['Minutos Calma'] || 0
      },
      dicas: {
        estudo: linha['Dica'] || '',
        revisoes: linha['Dica de Revisões'] || '',
        questoes: linha['Dica de Questões'] || ''
      },
      pesos: {
        resumos: linha['Peso de Resumos'] || 1,
        revisoes: linha['Peso de Revisões'] || 1,
        questoes: linha['Peso de Questões'] || 1
      },
      numeroQuestoes: linha['Número de Questões'] || 1,
      links: {
        estudo: linha['Link de Estudo'] || '',
        resumo: linha['Link de Resumo'] || '',
        questoes: linha['Link de Questões'] || ''
      },
      referencia: linha['Referência'] || '',
      suplementar: linha['Suplementar'] === 1 || linha['Suplementar'] === '1'
    });
  });
  
  return Array.from(disciplinasMap.values());
};

/**
 * Criar curso completo no Firestore
 */
export const criarCursoCompleto = async (dadosCurso, disciplinas, mentorId, arquivoInfo) => {
  try {
    // 1. Criar o curso
    const cursoRef = doc(collection(db, 'cursos'));
    const cursoId = cursoRef.id;
    
    const totalAssuntos = disciplinas.reduce((acc, d) => acc + d.assuntos.length, 0);
    
    await setDoc(cursoRef, {
      nome: dadosCurso.nome,
      descricao: dadosCurso.descricao || '',
      mentorId,
      dataCriacao: new Date(),
      ativo: true,
      totalAssuntos,
      totalDisciplinas: disciplinas.length,
      arquivoOriginal: {
        nome: arquivoInfo.nome,
        url: arquivoInfo.url,
        dataUpload: new Date()
      }
    });
    
    // 2. Criar disciplinas e assuntos em batch
    const batch = writeBatch(db);
    let operacoes = 0;
    const MAX_BATCH = 500; // Firestore limit
    
    for (const disciplina of disciplinas) {
      // Criar disciplina
      const disciplinaRef = doc(collection(db, `cursos/${cursoId}/disciplinas`));
      
      batch.set(disciplinaRef, {
        nome: disciplina.nome,
        ordem: disciplina.ordem,
        totalAssuntos: disciplina.assuntos.length,
        cor: gerarCorAleatoria()
      });
      
      operacoes++;
      
      // Criar assuntos
      for (const assunto of disciplina.assuntos) {
        const assuntoRef = doc(collection(db, `cursos/${cursoId}/disciplinas/${disciplinaRef.id}/assuntos`));
        
        batch.set(assuntoRef, assunto);
        operacoes++;
        
        // Se chegou no limite, commita e cria novo batch
        if (operacoes >= MAX_BATCH) {
          await batch.commit();
          operacoes = 0;
        }
      }
    }
    
    // Commitar operações restantes
    if (operacoes > 0) {
      await batch.commit();
    }
    
    return {
      sucesso: true,
      cursoId,
      totalDisciplinas: disciplinas.length,
      totalAssuntos
    };
    
  } catch (error) {
    console.error('Erro ao criar curso:', error);
    return {
      sucesso: false,
      erro: 'Erro ao salvar dados no banco'
    };
  }
};

/**
 * Gerar cor aleatória para disciplina (tons pastéis)
 */
const gerarCorAleatoria = () => {
  const cores = [
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Amarelo
    '#EF4444', // Vermelho
    '#8B5CF6', // Roxo
    '#EC4899', // Rosa
    '#14B8A6', // Turquesa
    '#F97316', // Laranja
  ];
  
  return cores[Math.floor(Math.random() * cores.length)];
};

/**
 * Buscar cursos de um mentor
 */
export const buscarCursosPorMentor = async (mentorId) => {
  try {
    const cursosRef = collection(db, 'cursos');
    const q = query(
      cursosRef,
      where('mentorId', '==', mentorId),
      where('ativo', '==', true),
      orderBy('dataCriacao', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const cursos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      sucesso: true,
      cursos
    };
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar cursos'
    };
  }
};