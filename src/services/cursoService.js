import { 
  doc, 
  setDoc, 
  collection, 
  addDoc, 
  deleteDoc,
  updateDoc,
  writeBatch, 
  query, 
  where, 
  orderBy, 
  getDocs,
  increment,
  Timestamp
} from 'firebase/firestore';
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
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
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
    
    const batch = writeBatch(db);
    let operacoes = 0;
    const MAX_BATCH = 500;
    
    for (const disciplina of disciplinas) {
      const disciplinaRef = doc(collection(db, `cursos/${cursoId}/disciplinas`));
      
      batch.set(disciplinaRef, {
        nome: disciplina.nome,
        ordem: disciplina.ordem,
        totalAssuntos: disciplina.assuntos.length,
        cor: gerarCorAleatoria()
      });
      
      operacoes++;
      
      for (const assunto of disciplina.assuntos) {
        const assuntoRef = doc(collection(db, `cursos/${cursoId}/disciplinas/${disciplinaRef.id}/assuntos`));
        
        batch.set(assuntoRef, assunto);
        operacoes++;
        
        if (operacoes >= MAX_BATCH) {
          await batch.commit();
          operacoes = 0;
        }
      }
    }
    
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
 * Gerar cor aleatória para disciplina
 */
const gerarCorAleatoria = () => {
  const cores = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
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
      erro: 'Erro ao buscar cursos',
      cursos: []
    };
  }
};

/**
 * Adicionar disciplina manualmente
 */
export const adicionarDisciplina = async (cursoId, dadosDisciplina) => {
  try {
    const disciplinasRef = collection(db, `cursos/${cursoId}/disciplinas`);
    
    const novaDisciplina = {
      nome: dadosDisciplina.nome,
      cor: dadosDisciplina.cor || '#3B82F6',
      ordem: dadosDisciplina.ordem || 0,
      totalAssuntos: 0,
      dataCriacao: Timestamp.now()
    };

    const docRef = await addDoc(disciplinasRef, novaDisciplina);

    const cursoRef = doc(db, 'cursos', cursoId);
    await updateDoc(cursoRef, {
      totalDisciplinas: increment(1)
    });

    return {
      sucesso: true,
      disciplinaId: docRef.id
    };
  } catch (error) {
    console.error('Erro ao adicionar disciplina:', error);
    return {
      sucesso: false,
      erro: 'Erro ao adicionar disciplina'
    };
  }
};

/**
 * Excluir disciplina
 */
export const excluirDisciplina = async (cursoId, disciplinaId) => {
  try {
    const batch = writeBatch(db);

    const assuntosRef = collection(db, `cursos/${cursoId}/disciplinas/${disciplinaId}/assuntos`);
    const assuntosSnapshot = await getDocs(assuntosRef);
    
    let totalAssuntosExcluidos = 0;
    assuntosSnapshot.forEach((assuntoDoc) => {
      batch.delete(assuntoDoc.ref);
      totalAssuntosExcluidos++;
    });

    const disciplinaRef = doc(db, `cursos/${cursoId}/disciplinas`, disciplinaId);
    batch.delete(disciplinaRef);

    const cursoRef = doc(db, 'cursos', cursoId);
    batch.update(cursoRef, {
      totalDisciplinas: increment(-1),
      totalAssuntos: increment(-totalAssuntosExcluidos)
    });

    await batch.commit();

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao excluir disciplina:', error);
    return {
      sucesso: false,
      erro: 'Erro ao excluir disciplina'
    };
  }
};

/**
 * NOVA FUNCIONALIDADE: Adicionar assunto manualmente
 */
export const adicionarAssunto = async (cursoId, disciplinaId, dadosAssunto) => {
  try {
    const assuntosRef = collection(db, `cursos/${cursoId}/disciplinas/${disciplinaId}/assuntos`);
    
    const novoAssunto = {
      titulo: dadosAssunto.titulo,
      ordem: dadosAssunto.ordem || 0,
      tempos: {
        paginasOuMinutos: parseInt(dadosAssunto.paginasOuMinutos) || 0,
        expresso: parseInt(dadosAssunto.expresso) || 0,
        regular: parseInt(dadosAssunto.regular) || 0,
        calma: parseInt(dadosAssunto.calma) || 0
      },
      dicas: {
        estudo: dadosAssunto.dicaEstudo || '',
        revisoes: dadosAssunto.dicaRevisoes || '',
        questoes: dadosAssunto.dicaQuestoes || ''
      },
      pesos: {
        resumos: parseInt(dadosAssunto.pesoResumos) || 1,
        revisoes: parseInt(dadosAssunto.pesoRevisoes) || 1,
        questoes: parseInt(dadosAssunto.pesoQuestoes) || 1
      },
      numeroQuestoes: parseInt(dadosAssunto.numeroQuestoes) || 1,
      links: {
        estudo: dadosAssunto.linkEstudo || '',
        resumo: dadosAssunto.linkResumo || '',
        questoes: dadosAssunto.linkQuestoes || ''
      },
      referencia: dadosAssunto.referencia || '',
      suplementar: dadosAssunto.suplementar || false,
      dataCriacao: Timestamp.now()
    };

    const docRef = await addDoc(assuntosRef, novoAssunto);

    // Atualizar contadores
    const disciplinaRef = doc(db, `cursos/${cursoId}/disciplinas`, disciplinaId);
    await updateDoc(disciplinaRef, {
      totalAssuntos: increment(1)
    });

    const cursoRef = doc(db, 'cursos', cursoId);
    await updateDoc(cursoRef, {
      totalAssuntos: increment(1)
    });

    return {
      sucesso: true,
      assuntoId: docRef.id
    };
  } catch (error) {
    console.error('Erro ao adicionar assunto:', error);
    return {
      sucesso: false,
      erro: 'Erro ao adicionar assunto'
    };
  }
};

/**
 * NOVA FUNCIONALIDADE: Excluir assunto
 */
export const excluirAssunto = async (cursoId, disciplinaId, assuntoId) => {
  try {
    const batch = writeBatch(db);

    // Excluir o assunto
    const assuntoRef = doc(db, `cursos/${cursoId}/disciplinas/${disciplinaId}/assuntos`, assuntoId);
    batch.delete(assuntoRef);

    // Atualizar contadores
    const disciplinaRef = doc(db, `cursos/${cursoId}/disciplinas`, disciplinaId);
    batch.update(disciplinaRef, {
      totalAssuntos: increment(-1)
    });

    const cursoRef = doc(db, 'cursos', cursoId);
    batch.update(cursoRef, {
      totalAssuntos: increment(-1)
    });

    await batch.commit();

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao excluir assunto:', error);
    return {
      sucesso: false,
      erro: 'Erro ao excluir assunto'
    };
  }
};