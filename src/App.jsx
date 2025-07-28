import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function App() {
  const jaCarregado = useRef(false);

  const [exercicios, setExercicios] = useState(() => {
    const dadosSalvos = localStorage.getItem('exercicios');
    return dadosSalvos ? JSON.parse(dadosSalvos) : [];
  });

  const [nome, setNome] = useState('');
  const [meta, setMeta] = useState('');
  const [categoria, setCategoria] = useState('DIARIO');
  const [quantidadeAdicionar, setQuantidadeAdicionar] = useState({});
  const [ordenacaoDiario, setOrdenacaoDiario] = useState('META_MENOR');
  const [ordenacaoMensal, setOrdenacaoMensal] = useState('PROGRESSO_MAIOR');
  const [buscaDiario, setBuscaDiario] = useState('');
  const [buscaMensal, setBuscaMensal] = useState('');
  const navigate = useNavigate();

  function normalizarNome(nome) {
    return nome
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase();
  }

  useEffect(() => {
    jaCarregado.current = true;
  }, []);

  useEffect(() => {
    if (jaCarregado.current) {
      localStorage.setItem('exercicios', JSON.stringify(exercicios));
    }
  }, [exercicios]);

  useEffect(() => {
  const hoje = new Date();
  const hojeStr = hoje.toLocaleDateString('pt-BR');
  const ultimoReset = localStorage.getItem('ultimoReset');

  if (hojeStr !== ultimoReset) {
    const dia = hoje.getDate();
    const mes = hoje.getMonth();
    const ano = hoje.getFullYear();
    const ultimoDiaDoMes = new Date(ano, mes + 1, 0).getDate();

    const novos = exercicios.map(e => {
      if (e.categoria === 'DIARIO') {
        return { ...e, atual: 0 };
      }
      if (e.categoria === 'MENSAL' && dia === ultimoDiaDoMes) {
        return { ...e, atual: 0 };
      }
      return e;
    });

    setExercicios(novos);
    localStorage.setItem('ultimoReset', hojeStr);
  }
}, []);


  function gerarChave(exercicio) {
    return `${exercicio.nome}_${exercicio.meta}`;
  }

  function adicionarMeta() {
    if (nome.trim() === '' || isNaN(meta) || Number(meta) <= 0) return;

    const nomeNormalizado = normalizarNome(nome);
    const novaMeta = {
      nome: nomeNormalizado,
      meta: Number(meta),
      atual: 0,
      categoria
    };

    setExercicios([...exercicios, novaMeta]);
    setNome('');
    setMeta('');
  }

  function zerarPorChave(nome, meta) {
    const novos = exercicios.map((e) => {
      if (e.nome === nome && e.meta === meta) {
        return { ...e, atual: 0 };
      }
      return e;
    });
    setExercicios(novos);
  }

  function excluirPorChave(nome, meta) {
    const novos = exercicios.filter((e) => !(e.nome === nome && e.meta === meta));
    setExercicios(novos);
  }

  function handleQuantidadeChange(chave, value) {
    setQuantidadeAdicionar(prev => ({
      ...prev,
      [chave]: value
    }));
  }

  function adicionarQtd(chave, nomeAlvo) {
    const qtd = parseInt(quantidadeAdicionar[chave] || '0');
    if (isNaN(qtd) || qtd <= 0) return;

    const novos = exercicios.map(e => {
      if (e.nome === nomeAlvo && e.atual < e.meta) {
        const novoValor = e.atual + qtd;
        const valorFinal = Math.min(novoValor, e.meta);

        if (e.categoria === 'DIARIO' && valorFinal === e.meta) {
          const historico = JSON.parse(localStorage.getItem('historico')) || [];
          historico.push({
            nome: e.nome,
            data: new Date().toLocaleDateString('pt-BR'),
            quantidade: e.meta,
          });
          localStorage.setItem('historico', JSON.stringify(historico));
        }

        return {
          ...e,
          atual: valorFinal
        };
      }
      return e;
    });

    setExercicios(novos);
    setQuantidadeAdicionar(prev => ({ ...prev, [chave]: '' }));
  }

  function ordenarExercicios(lista, criterio) {
    return [...lista].sort((a, b) => {
      switch (criterio) {
        case 'NOME_AZ': return a.nome.localeCompare(b.nome);
        case 'NOME_ZA': return b.nome.localeCompare(a.nome);
        case 'PROGRESSO_MAIOR': return b.atual - a.atual;
        case 'PROGRESSO_MENOR': return a.atual - b.atual;
        case 'META_MAIOR': return b.meta - a.meta;
        case 'META_MENOR': return a.meta - b.meta;
        default: return 0;
      }
    });
  }

  const diarios = ordenarExercicios(
    exercicios.filter(e => e.categoria === 'DIARIO' && e.nome.includes(normalizarNome(buscaDiario))),
    ordenacaoDiario
  );

  const mensais = ordenarExercicios(
    exercicios.filter(e => e.categoria === 'MENSAL' && e.nome.includes(normalizarNome(buscaMensal))),
    ordenacaoMensal
  );

  const progressoMensal = mensais.length === 0
    ? 0
    : Math.floor(
      mensais.reduce((acc, e) => acc + e.atual, 0) /
      mensais.reduce((acc, e) => acc + e.meta, 0) * 100
    );

  return (
    <div className="container">
      <h1>Metas de Exercício</h1>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate('/historico')} className="historico-botao">
          Ver Histórico
        </button>
      </div>

      <div className="inputs">
        <input
          type="text"
          placeholder="Nome do exercício"
          value={nome}
          onChange={e => setNome(e.target.value)}
        />
        <input
          type="number"
          placeholder="Meta"
          value={meta}
          onChange={e => setMeta(e.target.value)}
        />
        <select
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
        >
          <option value="DIARIO">Diário</option>
          <option value="MENSAL">Mensal</option>
        </select>
        <button onClick={adicionarMeta}>Adicionar</button>
      </div>

      <div className="listas-container">
        <div className="lista">
          <h2>Exercícios Diários</h2>
          <div className="filtros">
            <input
              type="text"
              placeholder="Buscar exercício"
              value={buscaDiario}
              onChange={e => setBuscaDiario(e.target.value)}
            />
            <label>Ordenar:</label>
            <select
              value={ordenacaoDiario}
              onChange={e => setOrdenacaoDiario(e.target.value)}
            >
              <option value="NOME_AZ">Nome (A-Z)</option>
              <option value="NOME_ZA">Nome (Z-A)</option>
              <option value="PROGRESSO_MAIOR">Progresso (↑)</option>
              <option value="PROGRESSO_MENOR">Progresso (↓)</option>
              <option value="META_MAIOR">Meta (↑)</option>
              <option value="META_MENOR">Meta (↓)</option>
            </select>
          </div>
          <div className="exercicios-container">
            {diarios.map((exercicio, index) => {
              const chave = gerarChave(exercicio);
              return (
                <div key={index} className="exercicio-card">
                  <h3>{exercicio.nome} ({exercicio.atual}/{exercicio.meta})</h3>
                  <progress value={exercicio.atual} max={exercicio.meta}></progress>
                  <div className="botoes">
                    <input
                      type="number"
                      min="1"
                      value={quantidadeAdicionar[chave] || ''}
                      onChange={e => handleQuantidadeChange(chave, e.target.value)}
                      placeholder="Qtd"
                    />
                    <button onClick={() => adicionarQtd(chave, exercicio.nome)}>Adicionar</button>
                    <button onClick={() => zerarPorChave(exercicio.nome, exercicio.meta)}>Zerar</button>
                    <button onClick={() => excluirPorChave(exercicio.nome, exercicio.meta)}>Excluir</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lista">
          <h2>Exercícios Mensais</h2>
          <div className="progresso-geral">
            <label>Progresso Geral: {progressoMensal}%</label>
            <progress value={progressoMensal} max="100"></progress>
          </div>
          <div className="filtros">
            <input
              type="text"
              placeholder="Buscar exercício"
              value={buscaMensal}
              onChange={e => setBuscaMensal(e.target.value)}
            />
            <label>Ordenar:</label>
            <select
              value={ordenacaoMensal}
              onChange={e => setOrdenacaoMensal(e.target.value)}
            >
              <option value="NOME_AZ">Nome (A-Z)</option>
              <option value="NOME_ZA">Nome (Z-A)</option>
              <option value="PROGRESSO_MAIOR">Progresso (↑)</option>
              <option value="PROGRESSO_MENOR">Progresso (↓)</option>
              <option value="META_MAIOR">Meta (↑)</option>
              <option value="META_MENOR">Meta (↓)</option>
            </select>
          </div>
          <div className="exercicios-container">
            {mensais.map((exercicio, index) => {
              const chave = gerarChave(exercicio);
              return (
                <div key={index} className="exercicio-card">
                  <h3>{exercicio.nome} ({exercicio.atual}/{exercicio.meta})</h3>
                  <progress value={exercicio.atual} max={exercicio.meta}></progress>
                  <div className="botoes">
                    <input
                      type="number"
                      min="1"
                      value={quantidadeAdicionar[chave] || ''}
                      onChange={e => handleQuantidadeChange(chave, e.target.value)}
                      placeholder="Qtd"
                    />
                    <button onClick={() => zerarPorChave(exercicio.nome, exercicio.meta)}>Zerar</button>
                    <button onClick={() => excluirPorChave(exercicio.nome, exercicio.meta)}>Excluir</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
