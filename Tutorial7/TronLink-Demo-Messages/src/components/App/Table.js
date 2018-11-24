import React from 'react'

class Table extends React.Component {
  render() {
    return (
      <table className='table'>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name of candidate</th>
            <th>Votes</th>
          </tr>
        </thead>
        <tbody >
          {this.props.candidates.map((candidate) => {
            return(
              <tr key={candidate.id.toString()}>
                <th>{candidate.id}</th>
                <td>{candidate.name}</td>
                <td>{candidate.voteCount}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }
}

export default Table;
