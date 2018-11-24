import React from 'react'

class From extends React.Component {
  render() {
    return (
      <form onSubmit={(event) => {
        event.preventDefault()
        this.props.castVote(this.candidateId.value)
      }}>
        <div className='form-group'>
          <label>Candidate Selection</label>
          <select ref={(input) => this.candidateId = input} className='form-control'>
            {this.props.candidates.map((candidate) => {
              return <option key={candidate.id.toString()} value={candidate.id}>{candidate.name}</option>
            })}
          </select>
        </div>
        <button type='submit' className='btn btn-primary'>Vote here</button>
        <hr />
      </form>
    )
  }
}

export default From;
