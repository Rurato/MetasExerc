import React, { useEffect, useState } from 'react';
import './historico.css';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';

function agruparPorDataEExercicio(historico) {
  const agrupado = {};
  historico.forEach(item => {
    const data = item.data;
    const nome = item.nome;
    if (!agrupado[data]) agrupado[data] = {};
    if (!agrupado[data][nome]) agrupado[data][nome] = 0;
    agrupado[data][nome] += item.quantidade;
  });

  const resultado = Object.entries(agrupado).map(([data, exercicios]) => ({
    data,
    ...exercicios
  }));

  return resultado;
}

function Historico() {
  const [historico, setHistorico] = useState(() => {
    const salvo = localStorage.getItem('historico');
    return salvo ? JSON.parse(salvo) : [];
  });

  const [ordenacao, setOrdenacao] = useState('desc');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [dadosFiltrados, setDadosFiltrados] = useState([]);

  // Define a data inicial e final padrão ao carregar
  useEffect(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();

    const primeiroDia = new Date(ano, mes, 1).toISOString().split('T')[0];
    const ultimoDia = new Date(ano, mes + 1, 0).toISOString().split('T')[0];

    setDataInicial(primeiroDia);
    setDataFinal(ultimoDia);
  }, []);

  useEffect(() => {
    if (!dataInicial || !dataFinal) return;

    const inicio = new Date(dataInicial).getTime();
    const fim = new Date(dataFinal).getTime();

    const filtrado = historico.filter(h => {
      const [dia, mes, ano] = h.data.split('/');
      const data = new Date(`${ano}-${mes}-${dia}`).getTime();
      return data >= inicio && data <= fim;
    });

    setDadosFiltrados(filtrado);
  }, [historico, dataInicial, dataFinal]);

  const dadosGrafico = agruparPorDataEExercicio(dadosFiltrados);

  const nomesExercicios = Array.from(new Set(historico.map(h => h.nome)));

  function removerRegistro(index) {
    const atualizado = [...historico];
    atualizado.splice(index, 1);
    setHistorico(atualizado);
    localStorage.setItem('historico', JSON.stringify(atualizado));
  }

  function ordenarRegistros(lista, ordem) {
    return [...lista].sort((a, b) => {
      const [diaA, mesA, anoA] = a.data.split('/');
      const [diaB, mesB, anoB] = b.data.split('/');
      const dataA = new Date(`${anoA}-${mesA}-${diaA}`).getTime();
      const dataB = new Date(`${anoB}-${mesB}-${diaB}`).getTime();
      return ordem === 'asc' ? dataA - dataB : dataB - dataA;
    });
  }

  const registrosOrdenados = ordenarRegistros(dadosFiltrados, ordenacao);

  const cores = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042',
  '#a4de6c', '#d0ed57', '#8dd1e1', '#ffbb28'
];

  return (
    <div className="historico-container">
      <h1>Histórico de Conclusões</h1>
      <div className="voltar">
        <Link to="/">
          <button className="btn-voltar">← Voltar</button>
        </Link>
      </div>

      <div className="filtros-historico">
        <label>Data inicial:</label>
        <input
          type="date"
          value={dataInicial}
          onChange={e => setDataInicial(e.target.value)}
        />

        <label>Data final:</label>
        <input
          type="date"
          value={dataFinal}
          onChange={e => setDataFinal(e.target.value)}
        />

        
      </div>

      {dadosGrafico.length === 0 ? (
        <p>Nenhum registro encontrado no período selecionado.</p>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={dadosGrafico}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="data" />
            <YAxis />
            <Tooltip />
            <Legend />
            {nomesExercicios.map((nome, i) => (
              <Bar key={nome} dataKey={nome} fill={cores[i % cores.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}

      <div className="lista-registros">
        <h2>Registros</h2>
        <label>Ordenar registros:</label>
        <select value={ordenacao} onChange={e => setOrdenacao(e.target.value)}>
          <option value="desc">Mais recentes primeiro</option>
          <option value="asc">Mais antigos primeiro</option>
        </select>
        <br/>
        <br/>
        {registrosOrdenados.map((item, index) => (
          <div key={index} className="registro">
            <span>{item.data} - {item.nome}: {item.quantidade}</span>
            <button onClick={() => removerRegistro(historico.indexOf(item))}>Remover</button>
          </div>
        ))}
      </div>
    </div>
  );
}



export default Historico;
