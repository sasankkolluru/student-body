// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Voting
 * @dev A smart contract for secure and transparent voting
 */
contract Voting {
    // Struct to represent a poll
    struct Poll {
        uint256 id;
        string question;
        string[] options;
        uint256[] votes;
        uint256 endTime;
        bool isActive;
        address creator;
        mapping(address => bool) hasVoted;
    }

    // Mapping from poll ID to Poll
    mapping(uint256 => Poll) public polls;
    
    // Poll counter
    uint256 public pollCount;
    
    // Events
    event PollCreated(uint256 pollId, string question, address creator);
    event VoteCast(uint256 indexed pollId, uint256 optionId, address voter);
    event PollEnded(uint256 pollId);

    // Modifiers
    modifier onlyActivePoll(uint256 _pollId) {
        require(polls[_pollId].isActive, "Poll is not active");
        require(block.timestamp < polls[_pollId].endTime, "Voting period has ended");
        _;
    }

    modifier onlyPollCreator(uint256 _pollId) {
        require(msg.sender == polls[_pollId].creator, "Only poll creator can perform this action");
        _;
    }

    // Create a new poll
    function createPoll(
        string memory _question,
        string[] memory _options,
        uint256 _durationInMinutes
    ) external returns (uint256) {
        require(_options.length > 1, "At least 2 options required");
        require(_durationInMinutes > 0, "Duration must be greater than 0");

        uint256 pollId = pollCount++;
        Poll storage newPoll = polls[pollId];
        
        newPoll.id = pollId;
        newPoll.question = _question;
        newPoll.options = _options;
        newPoll.votes = new uint256[](_options.length);
        newPoll.endTime = block.timestamp + (_durationInMinutes * 1 minutes);
        newPoll.isActive = true;
        newPoll.creator = msg.sender;

        emit PollCreated(pollId, _question, msg.sender);
        return pollId;
    }

    // Cast a vote
    function vote(uint256 _pollId, uint256 _optionId) external onlyActivePoll(_pollId) {
        Poll storage poll = polls[_pollId];
        require(!poll.hasVoted[msg.sender], "Already voted");
        require(_optionId < poll.options.length, "Invalid option");

        poll.votes[_optionId]++;
        poll.hasVoted[msg.sender] = true;

        emit VoteCast(_pollId, _optionId, msg.sender);
    }

    // End a poll manually (only creator can do this)
    function endPoll(uint256 _pollId) external onlyPollCreator(_pollId) {
        require(polls[_pollId].isActive, "Poll is not active");
        
        polls[_pollId].isActive = false;
        emit PollEnded(_pollId);
    }

    // Get poll details
    function getPoll(uint256 _pollId) external view returns (
        uint256 id,
        string memory question,
        string[] memory options,
        uint256[] memory votes,
        uint256 endTime,
        bool isActive,
        address creator
    ) {
        Poll storage poll = polls[_pollId];
        return (
            poll.id,
            poll.question,
            poll.options,
            poll.votes,
            poll.endTime,
            poll.isActive,
            poll.creator
        );
    }

    // Check if an address has voted in a specific poll
    function hasVoted(uint256 _pollId, address _voter) external view returns (bool) {
        return polls[_pollId].hasVoted[_voter];
    }

    // Get vote count for a specific option
    function getVoteCount(uint256 _pollId, uint256 _optionId) external view returns (uint256) {
        require(_optionId < polls[_pollId].options.length, "Invalid option");
        return polls[_pollId].votes[_optionId];
    }
}
